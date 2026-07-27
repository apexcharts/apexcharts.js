// @ts-check
/**
 * LicenseManager - vendored copy of the ApexCharts family license scheme.
 *
 * A minimal, dependency-free port of `apex-commons`
 * (projects/libs/commons/src/lib/LicenseManager.ts), the implementation
 * apexgantt / apextree / apexsankey / apex-grid-enterprise / apexstock use. It is
 * vendored rather than imported so core `apexcharts` keeps its
 * zero-runtime-dependency guarantee. The key FORMAT and VALIDATION rules are
 * identical, so one customer key works across the whole family. That agreement is
 * a contract: read `projects/libs/commons/LICENSING.md` before changing anything
 * here.
 *
 * Key format: `APEX-<base64(JSON)>` where JSON =
 *   { issueDate, expiryDate, plan, domains?: string[], sig?: string }
 *
 * `sig` is base64url of an ECDSA P-256 / SHA-256 signature over the exact string
 *   v1|<issueDate>|<expiryDate>|<plan>|<domains joined by comma, or empty>
 *
 * Two things about that shape are load-bearing:
 *
 * 1. **The signature sits inside the envelope.** `APEX-<payload>.<sig>` was tried
 *    first and breaks every build released before signing existed, because the
 *    old decoder ran `atob` over everything after the first dash and a `.` makes
 *    that throw. Customers upgrade on their own schedule, so a key has to satisfy
 *    the old validator and the new one.
 * 2. **The signature covers the canonical string, not the JSON,** because JSON
 *    key order is not guaranteed and a verifier rebuilding the object could
 *    produce different bytes from the signer.
 *
 * Signing does not prevent unlicensed use: this code runs on the reader's
 * machine. What it removes is the *shareable forged key*, since a working key used
 * to be three lines of base64 anyone could publish, and it makes expiry and
 * domain locking mean something. Enforcement stays trial-mode: nothing is
 * degraded or blocked, a watermark appears.
 *
 * Verification is asynchronous because `crypto.subtle` has no sync API, while
 * `validateKey` is called synchronously per chart during render. A structurally
 * sound key is accepted provisionally and corrected a microtask later;
 * `LicenseEnforcer` subscribes through `onChange` and re-evaluates live charts
 * when a verdict lands, so a forged key still ends up watermarked.
 *
 * State is a static singleton (process-global), so setLicense affects every chart
 * on the page.
 *
 * @module modules/license/LicenseManager
 */

/**
 * @typedef {Object} LicenseData
 * @property {readonly string[]} [domains]
 * @property {string} expiryDate
 * @property {string} issueDate
 * @property {string} plan
 * @property {boolean} valid
 */

/**
 * @typedef {Object} LicenseValidationResult
 * @property {LicenseData} [data]
 * @property {boolean} expired
 * @property {string} [message]
 * @property {boolean} [signatureVerified]
 * @property {boolean} valid
 */

/**
 * ECDSA P-256 public keys, SPKI DER, base64. Must match
 * PUBLIC_KEYS_SPKI_BASE64 in apex-commons.
 *
 * A list, not one key: the public key ships inside every bundle, so replacing it
 * is a release and customers upgrade whenever they upgrade. Listing the outgoing
 * and incoming keys together makes rotation a gradual overlap rather than a day on
 * which every previously issued key stops verifying.
 */
const PUBLIC_KEYS_SPKI_BASE64 = [
  'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQIaK9UMD6n0oR/FIy8QdL0uSzKMQlf1BB+tOrji4/WuHsyRNxeDhVykoSsNURozMi1xhmqWvBH1L//xIfugTPA==',
]

/**
 * Until this date, keys with no `sig` are honoured, silently.
 *
 * Every key issued before signing existed is unsigned, so rejecting them would
 * break paying customers the moment they upgrade. Renewals re-issue keys, so the
 * unsigned population drains on its own, and this window is about one annual term
 * wide to let that happen. Until it closes, signing is not enforced. Keep in step
 * with apex-commons.
 */
const LEGACY_KEYS_ACCEPTED_UNTIL = new Date('2027-07-31T00:00:00Z')

const KEY_PREFIX = 'APEX-'

/**
 * Signature verdicts by key string: true verified, false refuted, absent not yet
 * known. Per key, because `chart.license` and `window.Apex.license` mean several
 * distinct keys can be live on one page.
 * @type {Map<string, boolean>}
 */
const signatureVerdicts = new Map()
/** Keys whose verification is in flight, so it is not started twice. @type {Set<string>} */
const verifying = new Set()
/** @type {Set<(result: LicenseValidationResult) => void>} */
const listeners = new Set()

let warnedUnverifiable = false

/**
 * Cross-environment base64 decode (browser atob, else Node Buffer).
 * @param {string} encoded @returns {string}
 */
function base64Decode(encoded) {
  if (typeof atob === 'function') return atob(encoded)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(encoded, 'base64').toString('binary')
  }
  throw new Error('no base64 decoder available')
}

/**
 * Base64 (standard or url-safe) to bytes.
 * @param {string} base64 @returns {Uint8Array}
 */
function base64ToBytes(base64) {
  const normalised = base64.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalised.padEnd(Math.ceil(normalised.length / 4) * 4, '=')
  const binary = base64Decode(padded)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  return bytes
}

/**
 * The exact bytes a signature covers. Must stay byte-identical to
 * `canonicalPayload` in apex-commons and in the issuing service.
 * @param {LicenseData} data @returns {string}
 */
function canonicalPayload(data) {
  const domains =
    data.domains && data.domains.length > 0 ? data.domains.join(',') : ''

  return `v1|${data.issueDate}|${data.expiryDate}|${data.plan}|${domains}`
}

/**
 * Current hostname, or '' when there is no browser location (SSR).
 * @returns {string}
 */
function currentHostname() {
  return typeof window !== 'undefined' && window.location
    ? window.location.hostname
    : ''
}

/**
 * The `sig` field of a key, or null when it carries none.
 * @param {string} encodedData
 * @returns {string | null}
 */
function signatureOf(encodedData) {
  try {
    const raw = JSON.parse(base64Decode(encodedData))

    return typeof raw.sig === 'string' && raw.sig ? raw.sig : null
  } catch {
    return null
  }
}

/** @param {LicenseValidationResult} result */
function notify(result) {
  listeners.forEach((listener) => {
    try {
      listener(result)
    } catch {
      // A listener must never take licence state, or a render, down with it.
    }
  })
}

/**
 * Verify a key's signature and remember the verdict.
 *
 * Unverifiable is deliberately not the same as invalid. `crypto.subtle` exists
 * only in secure contexts, so a page served over plain HTTP cannot verify;
 * treating that as invalid would watermark paying customers on an HTTP intranet.
 * It does mean HTTP sidesteps verification, which is the same ceiling as patching
 * the bundle rather than a new hole.
 *
 * @param {string} key
 * @param {LicenseData} data
 * @param {string} signature
 */
async function verifySignature(key, data, signature) {
  if (verifying.has(key) || signatureVerdicts.has(key)) return
  verifying.add(key)

  const subtle = globalThis.crypto ? globalThis.crypto.subtle : undefined
  const accepted = LicenseManager.publicKeysSpki

  if (!subtle || accepted.length === 0) {
    verifying.delete(key)

    if (!warnedUnverifiable) {
      warnedUnverifiable = true
      console.warn(
        subtle
          ? '[Apex] No license signing key is configured in this build, so license signatures cannot be verified.'
          : '[Apex] Web Crypto is unavailable (a secure context is required), so the license signature cannot be verified.',
      )
    }

    return
  }

  const signed = new TextEncoder().encode(canonicalPayload(data))
  let verified = false

  // Any accepted key verifying is enough; during a rotation both are listed.
  for (const spki of accepted) {
    try {
      const publicKey = await subtle.importKey(
        'spki',
        base64ToBytes(spki),
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify'],
      )

      verified = await subtle.verify(
        { hash: 'SHA-256', name: 'ECDSA' },
        publicKey,
        base64ToBytes(signature),
        signed,
      )
    } catch {
      // A malformed entry must not stop the others being tried.
      verified = false
    }

    if (verified) break
  }

  verifying.delete(key)
  signatureVerdicts.set(key, verified)

  if (!verified) {
    console.error(
      '[Apex] Invalid license key. The license signature does not verify.',
    )
  }

  // Charts already painted decided the watermark synchronously, so they have to
  // be asked again. LicenseEnforcer registers the listener that does it.
  notify(LicenseManager.validateKey(key))
}

export class LicenseManager {
  /** @type {null | string} */
  static licenseKey = null
  /**
   * Accepted signing keys. Replaced by tests with an ephemeral keypair, since
   * they cannot sign for the production key. Not public API.
   * @type {string[]}
   */
  static publicKeysSpki = PUBLIC_KEYS_SPKI_BASE64
  /** @type {LicenseValidationResult | null} */
  static validationResult = null

  /**
   * Decode license data from an encoded string (base64 + JSON).
   * @param {string} encodedData
   * @returns {LicenseData | null}
   */
  static decodeLicenseData(encodedData) {
    try {
      const data = JSON.parse(base64Decode(encodedData))

      // Require the mandatory fields.
      if (!data.issueDate || !data.expiryDate || !data.plan) {
        return null
      }

      return {
        domains: Array.isArray(data.domains) ? data.domains : undefined,
        expiryDate: data.expiryDate,
        issueDate: data.issueDate,
        plan: data.plan,
        valid: true,
      }
    } catch {
      return null
    }
  }

  /**
   * The key set via setLicense (or null). Lets the enforcer resolve the
   * chart.license -> setLicense -> Apex.license precedence.
   * @returns {null | string}
   */
  static getKey() {
    return this.licenseKey
  }

  /**
   * Validation result for the singleton key.
   * @returns {LicenseValidationResult}
   */
  static getLicenseStatus() {
    if (!this.licenseKey) {
      return { expired: false, valid: false }
    }
    // Recomputed rather than cached, so a signature verdict arriving after the
    // first call is reflected instead of being pinned to the provisional answer.
    this.validationResult = this.validateKey(this.licenseKey)

    return this.validationResult
  }

  /**
   * Whether a specific key is valid (pure; no singleton mutation).
   * @param {string | undefined | null} key
   * @returns {boolean}
   */
  static isKeyValid(key) {
    if (!key) return false
    return this.validateKey(key).valid
  }

  /** @returns {boolean} whether the singleton key is valid */
  static isLicenseValid() {
    if (!this.licenseKey) return false
    return this.getLicenseStatus().valid
  }

  /**
   * Subscribe to signature verdicts arriving. Returns an unsubscribe function.
   *
   * Without this a forged key would go unnoticed by any chart that asked once and
   * painted. `LicenseEnforcer` uses it to re-evaluate every live chart.
   *
   * @param {(result: LicenseValidationResult) => void} listener
   * @returns {() => void}
   */
  static onChange(listener) {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  }

  /**
   * Set the global (singleton) license key. console.errors when invalid, to
   * match the rest of the family.
   * @param {string} key
   */
  static setLicense(key) {
    this.licenseKey = key
    this.validationResult = this.validateKey(key)

    if (!this.validationResult.valid) {
      console.error(`[Apex] ${this.validationResult.message}`)
    }
  }

  /**
   * Validate an arbitrary key WITHOUT mutating the singleton. Used to resolve
   * per-chart (`chart.license`) and global (`window.Apex.license`) keys, which
   * bypass setLicense. This is a superset of the family (which keeps
   * validateLicense private); the format and rules are identical.
   *
   * Synchronous by contract, because it runs during render. Signature checking is
   * started here and settles later; see `onChange`.
   *
   * @param {string} key
   * @returns {LicenseValidationResult}
   */
  static validateKey(key) {
    try {
      if (typeof key !== 'string' || !key.startsWith(KEY_PREFIX)) {
        return {
          expired: false,
          message:
            'Invalid license key format. License key must start with "APEX-".',
          signatureVerified: false,
          valid: false,
        }
      }

      const encodedData = key.slice(KEY_PREFIX.length)

      if (!encodedData) {
        return {
          expired: false,
          message:
            'Invalid license key format. Expected format: APEX-{encoded-data}.',
          signatureVerified: false,
          valid: false,
        }
      }

      const licenseData = this.decodeLicenseData(encodedData)

      if (!licenseData) {
        return {
          expired: false,
          message: 'Invalid license key. Unable to decode license data.',
          signatureVerified: false,
          valid: false,
        }
      }

      const signature = signatureOf(encodedData)

      // An unsigned key is accepted in silence until the cutoff, then rejected.
      //
      // Deliberately no deprecation warning in between. Renewals re-issue keys,
      // so every subscriber gets a signed one long before the cutoff without
      // doing anything, and a console warning would appear for every existing
      // customer the moment they upgrade, a year before it is actionable. That
      // reads as an incident on our side and invites tickets whose honest answer
      // is "ignore this". See projects/libs/commons/LICENSING.md; it makes the
      // dry run over stored keys load bearing rather than optional, since nothing
      // else will surface a licence that outlives renewal churn.
      if (!signature && new Date() >= LEGACY_KEYS_ACCEPTED_UNTIL) {
        // Naming the format turns a mystifying rejection into a support answer.
        return {
          data: licenseData,
          expired: false,
          message:
            'This license key is in the old unsigned format, which is no longer accepted. Please request a replacement key.',
          signatureVerified: false,
          valid: false,
        }
      }

      // Expiry check.
      const now = new Date()
      const expiryDate = new Date(licenseData.expiryDate)

      if (expiryDate < now) {
        return {
          data: licenseData,
          expired: true,
          message: `License expired on ${licenseData.expiryDate}. Please renew your license.`,
          signatureVerified: false,
          valid: false,
        }
      }

      // Domain lock (only when the key carries domains).
      if (licenseData.domains && licenseData.domains.length > 0) {
        const hostname = currentHostname()
        const allowed = licenseData.domains.some(
          (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
        )

        if (!allowed) {
          return {
            data: licenseData,
            expired: false,
            message: `License is not valid for this domain (${hostname}). Allowed domains: ${licenseData.domains.join(', ')}.`,
            signatureVerified: false,
            valid: false,
          }
        }
      }

      if (signature) {
        const verdict = signatureVerdicts.get(key)

        if (verdict === false) {
          return {
            data: licenseData,
            expired: false,
            message:
              'Invalid license key. The license signature does not verify.',
            signatureVerified: true,
            valid: false,
          }
        }

        if (verdict === undefined) {
          // Provisionally accepted while this runs. Failing closed instead would
          // watermark every paying customer for a frame on every page load.
          void verifySignature(key, licenseData, signature)
        }

        return {
          data: licenseData,
          expired: false,
          signatureVerified: verdict === true,
          valid: true,
        }
      }

      return {
        data: licenseData,
        expired: false,
        signatureVerified: false,
        valid: true,
      }
    } catch {
      return {
        expired: false,
        message: 'Invalid license key format or corrupted data.',
        signatureVerified: false,
        valid: false,
      }
    }
  }

  /** Test-only: forget signature verdicts and the one-time warnings. */
  static _resetSignatureState() {
    signatureVerdicts.clear()
    verifying.clear()
    warnedUnverifiable = false
  }
}

// @ts-check
/**
 * LicenseManager - vendored copy of the ApexCharts family license scheme.
 *
 * This is a minimal, dependency-free port of `apex-commons`
 * (projects/libs/commons/src/lib/LicenseManager.ts), the exact implementation
 * apexgantt / apextree / apexsankey / apex-grid-enterprise / apexstock use. It
 * is vendored (not imported as a dependency) so the core `apexcharts` library
 * keeps its zero-runtime-dependency guarantee. The key FORMAT and VALIDATION
 * rules are identical, so a single customer key works across the whole family.
 *
 * Key format: `APEX-<base64(JSON)>` where JSON =
 *   { issueDate, expiryDate, plan, domains?: string[] }
 * Unsigned base64 (offline, no network, no signature). `plan` is decoded but
 * not enforced at runtime.
 *
 * State is a static singleton (process-global), so setLicense affects every
 * chart on the page.
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
 * @property {boolean} valid
 */

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
 * Cross-environment base64 encode (used by generateLicenseKey / tests).
 * @param {string} str @returns {string}
 */
function base64Encode(str) {
  if (typeof btoa === 'function') return btoa(str)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'binary').toString('base64')
  }
  throw new Error('no base64 encoder available')
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

export class LicenseManager {
  /** @type {null | string} */
  static licenseKey = null
  /** @type {LicenseValidationResult | null} */
  static validationResult = null

  /**
   * Decode license data from an encoded string (base64 + JSON).
   * @param {string} encodedData
   * @returns {LicenseData | null}
   */
  static decodeLicenseData(encodedData) {
    try {
      const decodedString = base64Decode(encodedData)
      const data = JSON.parse(decodedString)

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
   * Generate a license key (issuer-side helper; also used by tests). Mirrors
   * the family exactly so keys stay cross-compatible.
   * @param {string} issueDate
   * @param {string} expiryDate
   * @param {string} [plan]
   * @param {string[]} [domains]
   * @returns {string}
   */
  static generateLicenseKey(issueDate, expiryDate, plan = 'standard', domains) {
    /** @type {Record<string, unknown>} */
    const licenseData = { expiryDate, issueDate, plan }

    if (domains && domains.length > 0) {
      licenseData.domains = domains
    }

    return `APEX-${base64Encode(JSON.stringify(licenseData))}`
  }

  /**
   * Validate an arbitrary key WITHOUT mutating the singleton. Used to resolve
   * per-chart (`chart.license`) and global (`window.Apex.license`) keys, which
   * bypass setLicense. This is a superset of the family (which keeps
   * validateLicense private); the format and rules are identical.
   * @param {string} key
   * @returns {LicenseValidationResult}
   */
  static validateKey(key) {
    try {
      if (typeof key !== 'string' || !key.startsWith('APEX-')) {
        return {
          expired: false,
          message:
            'Invalid license key format. License key must start with "APEX-".',
          valid: false,
        }
      }

      const separatorIndex = key.indexOf('-')
      const encodedData =
        separatorIndex !== -1 ? key.slice(separatorIndex + 1) : ''

      if (!encodedData) {
        return {
          expired: false,
          message:
            'Invalid license key format. Expected format: APEX-{encoded-data}.',
          valid: false,
        }
      }

      const licenseData = this.decodeLicenseData(encodedData)

      if (!licenseData) {
        return {
          expired: false,
          message: 'Invalid license key. Unable to decode license data.',
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
            valid: false,
          }
        }
      }

      return { data: licenseData, expired: false, valid: true }
    } catch {
      return {
        expired: false,
        message: 'Invalid license key format or corrupted data.',
        valid: false,
      }
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
   * The key set via setLicense (or null). Lets the enforcer resolve the
   * chart.license -> setLicense -> Apex.license precedence.
   * @returns {null | string}
   */
  static getKey() {
    return this.licenseKey
  }

  /**
   * Validation result for the singleton key (cached).
   * @returns {LicenseValidationResult}
   */
  static getLicenseStatus() {
    if (!this.licenseKey) {
      return { expired: false, valid: false }
    }
    if (!this.validationResult) {
      this.validationResult = this.validateKey(this.licenseKey)
    }
    return this.validationResult
  }

  /** @returns {boolean} whether the singleton key is valid */
  static isLicenseValid() {
    if (!this.licenseKey) return false
    if (!this.validationResult) {
      this.validationResult = this.validateKey(this.licenseKey)
    }
    return this.validationResult.valid
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
}

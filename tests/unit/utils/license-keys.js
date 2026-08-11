import { generateKeyPairSync, sign, webcrypto } from 'node:crypto'
import { LicenseManager } from 'apex-commons'

/**
 * Minting licence keys for tests.
 *
 * The public key compiled into LicenseManager is the production one, and tests
 * cannot sign for it, so they install an ephemeral keypair instead. That keeps
 * the crypto path genuinely exercised rather than skipped, and means these tests
 * do not need to change when the production key rotates.
 *
 * The format mirrors `projects/libs/commons/LICENSING.md`. If a key minted here
 * stops satisfying the real validator, these helpers are wrong, not the
 * implementation.
 */

const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
})

export const TEST_PUBLIC_KEY_SPKI = publicKey
  .export({ format: 'der', type: 'spki' })
  .toString('base64')

/**
 * Point LicenseManager at the ephemeral keypair, and make sure SubtleCrypto
 * exists: jsdom does not implement it, and browsers expose it only in a secure
 * context.
 */
export function installTestSigningKey() {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: webcrypto,
    })
  }
  LicenseManager.publicKeysSpki = [TEST_PUBLIC_KEY_SPKI]
  LicenseManager._resetSignatureState()
}

function base64url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** The exact bytes signed. Mirrors canonicalPayload in the implementation. */
function canonical({ domains, expiryDate, issueDate, plan }) {
  return `v1|${issueDate}|${expiryDate}|${plan}|${
    domains && domains.length > 0 ? domains.join(',') : ''
  }`
}

function envelope(payload) {
  return `APEX-${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')}`
}

/** A correctly signed key, as the issuing service produces. */
export function signedKey(issueDate, expiryDate, plan = 'standard', domains) {
  const data = { expiryDate, issueDate, plan }
  if (domains && domains.length > 0) data.domains = domains

  const signature = sign('sha256', Buffer.from(canonical({ ...data, domains }), 'utf8'), {
    dsaEncoding: 'ieee-p1363',
    key: privateKey,
  })

  return envelope({ ...data, sig: base64url(signature) })
}

/** A key with a `sig` that is not a real signature. */
export function forgedKey(issueDate, expiryDate, plan = 'standard') {
  return envelope({
    expiryDate,
    issueDate,
    plan,
    sig: base64url(Buffer.alloc(64)),
  })
}

/** The pre-signing format: same envelope, no `sig`. Valid until the cutoff. */
export function unsignedKey(issueDate, expiryDate, plan = 'standard', domains) {
  const data = { expiryDate, issueDate, plan }
  if (domains && domains.length > 0) data.domains = domains

  return envelope(data)
}

/** Decode a key's payload. */
export function payloadOf(key) {
  return JSON.parse(Buffer.from(key.slice('APEX-'.length), 'base64').toString('utf8'))
}

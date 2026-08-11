import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { LicenseManager } from 'apex-commons'
import {
  forgedKey,
  installTestSigningKey,
  payloadOf,
  signedKey,
  unsignedKey,
} from './utils/license-keys.js'

// Mirrors projects/libs/commons/src/lib/LicenseManager.spec.ts (the family
// source of truth) against the vendored JS copy, so a key stays cross-
// compatible. Adds coverage for the vendored-only pure helpers
// (validateKey / getKey / isKeyValid) used to resolve per-chart / global keys.

beforeAll(installTestSigningKey)

function resetLicense() {
  LicenseManager.licenseKey = null
  LicenseManager.validationResult = null
  LicenseManager._resetSignatureState()
}

/** Keys are signed now; see tests/unit/utils/license-keys.js. */
function makeKey(issueDate, expiryDate, plan = 'standard', domains) {
  return signedKey(issueDate, expiryDate, plan, domains)
}

/** Wait for asynchronous signature verification to settle for a key. */
async function settled(key) {
  await vi.waitFor(() => {
    expect(LicenseManager.validateKey(key).signatureVerified).toBe(true)
  })
}

const FUTURE = '2099-01-01'
const PAST = '2000-01-01'
const TODAY_ISSUE = '2020-01-01'

describe('the key format', () => {
  it('is one dash-separated envelope, so pre-signing builds can decode it', () => {
    // The signature lives INSIDE the base64 payload. Putting it after a dot
    // breaks every client released before signing existed, because their decoder
    // ran atob over everything after the first dash.
    const key = makeKey(TODAY_ISSUE, FUTURE)
    expect(key).toMatch(/^APEX-[A-Za-z0-9+/=]+$/)
    expect(key.split('-')).toHaveLength(2)
  })

  it('carries the licence fields plus a signature', () => {
    const payload = payloadOf(makeKey(TODAY_ISSUE, FUTURE, 'enterprise'))
    expect(payload.plan).toBe('enterprise')
    expect(payload.issueDate).toBe(TODAY_ISSUE)
    expect(payload.expiryDate).toBe(FUTURE)
    expect(payload.sig).toEqual(expect.any(String))
  })

  it('includes domains only when they are given', () => {
    expect(payloadOf(makeKey(TODAY_ISSUE, FUTURE)).domains).toBeUndefined()
    expect(payloadOf(makeKey(TODAY_ISSUE, FUTURE, 'standard', [])).domains).toBeUndefined()
    expect(
      payloadOf(makeKey(TODAY_ISSUE, FUTURE, 'standard', ['example.com'])).domains,
    ).toEqual(['example.com'])
  })
})

describe('signature verification', () => {
  beforeEach(resetLicense)

  it('accepts a correctly signed key once verified', async () => {
    const key = makeKey(TODAY_ISSUE, FUTURE, 'enterprise')
    LicenseManager.setLicense(key)

    // Accepted provisionally: validateKey is synchronous because it runs during
    // render, and crypto.subtle has no synchronous API.
    expect(LicenseManager.isLicenseValid()).toBe(true)
    await settled(key)
    expect(LicenseManager.isLicenseValid()).toBe(true)
  })

  it('rejects a key whose payload was edited after signing', async () => {
    const real = makeKey(TODAY_ISSUE, '2027-01-01', 'standard')
    const payload = payloadOf(real)
    payload.plan = 'enterprise'
    payload.expiryDate = FUTURE
    const forged = 'APEX-' + Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')

    LicenseManager.setLicense(forged)
    await vi.waitFor(() => {
      expect(LicenseManager.isLicenseValid()).toBe(false)
    })
    expect(LicenseManager.getLicenseStatus().message).toContain('signature does not verify')
  })

  it('rejects a hand-made signature, which the unsigned format allowed', async () => {
    LicenseManager.setLicense(forgedKey(TODAY_ISSUE, FUTURE, 'enterprise'))
    await vi.waitFor(() => {
      expect(LicenseManager.isLicenseValid()).toBe(false)
    })
  })

  it('verifies each key separately, since charts can carry their own', async () => {
    const good = makeKey(TODAY_ISSUE, FUTURE)
    const bad = forgedKey(TODAY_ISSUE, FUTURE)

    expect(LicenseManager.isKeyValid(good)).toBe(true)
    expect(LicenseManager.isKeyValid(bad)).toBe(true) // provisional
    await vi.waitFor(() => {
      expect(LicenseManager.isKeyValid(bad)).toBe(false)
    })
    expect(LicenseManager.isKeyValid(good)).toBe(true)
  })

  it('notifies subscribers when a verdict lands, so painted charts re-check', async () => {
    const seen = []
    const unsubscribe = LicenseManager.onChange((result) => seen.push(result.valid))

    LicenseManager.setLicense(forgedKey(TODAY_ISSUE, FUTURE))
    // Wait for the verdict specifically, not just for "any notification".
    // setLicense now publishes the provisional result too, so subscribers hear
    // about a licence the moment it is set rather than only when a verdict
    // corrects it. That is what makes setLicense un-watermark charts that have
    // already painted; waiting on seen.length would race that first event.
    await vi.waitFor(() => {
      expect(seen).toContain(false)
    })
    unsubscribe()

    expect(seen).toContain(false)
  })
})

describe('keys issued before signing existed', () => {
  beforeEach(resetLicense)

  it('is still accepted, because renewals have not replaced it yet', () => {
    LicenseManager.setLicense(unsignedKey(TODAY_ISSUE, FUTURE, 'enterprise'))

    const status = LicenseManager.getLicenseStatus()
    expect(status.valid).toBe(true)
    // Honoured, never claimed as cryptographically verified.
    expect(status.signatureVerified).toBe(false)
  })

  it('still has its expiry enforced', () => {
    LicenseManager.setLicense(unsignedKey(TODAY_ISSUE, PAST))
    expect(LicenseManager.getLicenseStatus().expired).toBe(true)
  })
})

describe('LicenseManager.setLicense + isLicenseValid', () => {
  beforeEach(resetLicense)

  it('returns false when no license has been set', () => {
    expect(LicenseManager.isLicenseValid()).toBe(false)
  })

  it('returns true for a valid, non-expired license', () => {
    LicenseManager.setLicense(makeKey(TODAY_ISSUE, FUTURE))
    expect(LicenseManager.isLicenseValid()).toBe(true)
  })

  it('returns false for an expired license', () => {
    LicenseManager.setLicense(makeKey(TODAY_ISSUE, PAST))
    expect(LicenseManager.isLicenseValid()).toBe(false)
  })

  it('returns false for a key that does not start with APEX-', () => {
    LicenseManager.setLicense('INVALID-KEY')
    expect(LicenseManager.isLicenseValid()).toBe(false)
  })

  it('returns false for a key with more than two dash-separated parts', () => {
    LicenseManager.setLicense('APEX-part1-part2')
    expect(LicenseManager.isLicenseValid()).toBe(false)
  })

  it('returns false for a key with invalid base64 encoded data', () => {
    LicenseManager.setLicense('APEX-!!!notbase64!!!')
    expect(LicenseManager.isLicenseValid()).toBe(false)
  })

  it('returns false for valid base64 but missing required fields', () => {
    LicenseManager.setLicense(`APEX-${btoa(JSON.stringify({ foo: 'bar' }))}`)
    expect(LicenseManager.isLicenseValid()).toBe(false)
  })
})

describe('LicenseManager.getLicenseStatus', () => {
  beforeEach(resetLicense)

  it('returns valid:false, expired:false when no key is set', () => {
    const status = LicenseManager.getLicenseStatus()
    expect(status.valid).toBe(false)
    expect(status.expired).toBe(false)
  })

  it('returns expired:true, valid:false for an expired key', () => {
    LicenseManager.setLicense(makeKey(TODAY_ISSUE, PAST))
    const status = LicenseManager.getLicenseStatus()
    expect(status.expired).toBe(true)
    expect(status.valid).toBe(false)
    expect(status.message).toMatch(/expired/i)
  })

  it('includes license data for a valid key', () => {
    LicenseManager.setLicense(makeKey(TODAY_ISSUE, FUTURE, 'pro'))
    const status = LicenseManager.getLicenseStatus()
    expect(status.data?.plan).toBe('pro')
    expect(status.data?.expiryDate).toBe(FUTURE)
  })

  it('revalidates rather than caching, so a late verdict is not pinned', () => {
    // Deliberately no longer the same object twice. Caching the first answer
    // would pin a forged key to the "valid" it was given provisionally, before
    // its signature had been checked, which is the one thing signing is for.
    LicenseManager.setLicense(makeKey(TODAY_ISSUE, FUTURE))

    const first = LicenseManager.getLicenseStatus()
    const second = LicenseManager.getLicenseStatus()
    expect(second).not.toBe(first)
    expect(second).toEqual(first)
  })
})

describe('LicenseManager - domain locking', () => {
  beforeEach(resetLicense)

  it('is valid when no domains are specified', () => {
    LicenseManager.setLicense(makeKey(TODAY_ISSUE, FUTURE))
    expect(LicenseManager.isLicenseValid()).toBe(true)
  })

  it('is valid when the hostname matches a locked domain (jsdom = localhost)', () => {
    LicenseManager.setLicense(makeKey(TODAY_ISSUE, FUTURE, 'standard', ['localhost']))
    expect(LicenseManager.isLicenseValid()).toBe(true)
  })

  it('is invalid when the hostname matches no locked domain', () => {
    LicenseManager.setLicense(makeKey(TODAY_ISSUE, FUTURE, 'standard', ['other.com']))
    expect(LicenseManager.isLicenseValid()).toBe(false)
  })

  it('domain-lock message names the disallowed domain', () => {
    LicenseManager.setLicense(makeKey(TODAY_ISSUE, FUTURE, 'standard', ['locked.com']))
    expect(LicenseManager.getLicenseStatus().message).toMatch(/locked\.com/)
  })
})

describe('LicenseManager - console.error on invalid setLicense', () => {
  beforeEach(resetLicense)

  it('console.errors when an invalid key is set', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    LicenseManager.setLicense('NOT-VALID')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('does not console.error for a valid key', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    LicenseManager.setLicense(makeKey(TODAY_ISSUE, FUTURE))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('LicenseManager - pure helpers (vendored additions)', () => {
  beforeEach(resetLicense)

  it('validateKey does not mutate the singleton', () => {
    const res = LicenseManager.validateKey(makeKey(TODAY_ISSUE, FUTURE))
    expect(res.valid).toBe(true)
    expect(LicenseManager.getKey()).toBeNull() // singleton untouched
    expect(LicenseManager.isLicenseValid()).toBe(false)
  })

  it('isKeyValid validates an arbitrary key without mutating state', () => {
    expect(LicenseManager.isKeyValid(makeKey(TODAY_ISSUE, FUTURE))).toBe(true)
    expect(LicenseManager.isKeyValid(makeKey(TODAY_ISSUE, PAST))).toBe(false)
    expect(LicenseManager.isKeyValid('nope')).toBe(false)
    expect(LicenseManager.isKeyValid(null)).toBe(false)
    expect(LicenseManager.isKeyValid(undefined)).toBe(false)
    expect(LicenseManager.getKey()).toBeNull()
  })

  it('getKey returns the key set via setLicense', () => {
    const key = makeKey(TODAY_ISSUE, FUTURE)
    LicenseManager.setLicense(key)
    expect(LicenseManager.getKey()).toBe(key)
  })
})

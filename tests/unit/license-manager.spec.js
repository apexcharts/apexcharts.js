import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LicenseManager } from '../../src/modules/license/LicenseManager.js'

// Mirrors projects/libs/commons/src/lib/LicenseManager.spec.ts (the family
// source of truth) against the vendored JS copy, so a key stays cross-
// compatible. Adds coverage for the vendored-only pure helpers
// (validateKey / getKey / isKeyValid) used to resolve per-chart / global keys.

function resetLicense() {
  LicenseManager.licenseKey = null
  LicenseManager.validationResult = null
}

function makeKey(issueDate, expiryDate, plan = 'standard', domains) {
  return LicenseManager.generateLicenseKey(issueDate, expiryDate, plan, domains)
}

const FUTURE = '2099-01-01'
const PAST = '2000-01-01'
const TODAY_ISSUE = '2020-01-01'

describe('LicenseManager.generateLicenseKey', () => {
  it('returns a string starting with "APEX-"', () => {
    expect(makeKey(TODAY_ISSUE, FUTURE)).toMatch(/^APEX-/)
  })

  it('produces exactly two dash-separated parts (APEX and encoded data)', () => {
    expect(makeKey(TODAY_ISSUE, FUTURE).split('-')).toHaveLength(2)
  })

  it('encodes a key that can be decoded back to the original data', () => {
    const key = makeKey(TODAY_ISSUE, FUTURE, 'enterprise')
    const decoded = JSON.parse(atob(key.split('-')[1]))
    expect(decoded.plan).toBe('enterprise')
    expect(decoded.issueDate).toBe(TODAY_ISSUE)
    expect(decoded.expiryDate).toBe(FUTURE)
  })

  it('omits the domains field when none are provided', () => {
    const decoded = JSON.parse(atob(makeKey(TODAY_ISSUE, FUTURE).split('-')[1]))
    expect(decoded.domains).toBeUndefined()
  })

  it('includes the domains field when domains are provided', () => {
    const key = makeKey(TODAY_ISSUE, FUTURE, 'standard', ['example.com'])
    const decoded = JSON.parse(atob(key.split('-')[1]))
    expect(decoded.domains).toEqual(['example.com'])
  })

  it('omits domains when an empty array is provided', () => {
    const key = makeKey(TODAY_ISSUE, FUTURE, 'standard', [])
    const decoded = JSON.parse(atob(key.split('-')[1]))
    expect(decoded.domains).toBeUndefined()
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

  it('caches validation (same object reference on repeated calls)', () => {
    LicenseManager.setLicense(makeKey(TODAY_ISSUE, FUTURE))
    expect(LicenseManager.getLicenseStatus()).toBe(
      LicenseManager.getLicenseStatus(),
    )
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

import { describe, it, expect } from 'vitest'
import { validateBSB, formatBSB } from '../bsb'

describe('validateBSB', () => {
  describe('valid BSBs', () => {
    it('validates a 6-digit BSB', () => {
      expect(validateBSB('062000')).toBe(true)
    })

    it('validates BSB with hyphen', () => {
      expect(validateBSB('062-000')).toBe(true)
    })

    it('validates BSB with spaces', () => {
      expect(validateBSB('062 000')).toBe(true)
    })

    it('validates various bank BSBs', () => {
      expect(validateBSB('033-001')).toBe(true) // Westpac
      expect(validateBSB('082-001')).toBe(true) // NAB
      expect(validateBSB('063-000')).toBe(true) // Commonwealth
      expect(validateBSB('013-000')).toBe(true) // ANZ
    })
  })

  describe('invalid BSBs', () => {
    it('returns false for empty string', () => {
      expect(validateBSB('')).toBe(false)
    })

    it('returns false for BSB with wrong length', () => {
      expect(validateBSB('06200')).toBe(false)
      expect(validateBSB('0620001')).toBe(false)
    })

    it('returns false for BSB with non-numeric characters', () => {
      expect(validateBSB('06200a')).toBe(false)
      expect(validateBSB('ABC-DEF')).toBe(false)
    })

    it('returns false for BSB with invalid separators', () => {
      expect(validateBSB('062.000')).toBe(false)
      expect(validateBSB('062/000')).toBe(false)
    })
  })
})

describe('formatBSB', () => {
  it('formats an unformatted BSB', () => {
    expect(formatBSB('062000')).toBe('062-000')
  })

  it('reformats an already formatted BSB', () => {
    expect(formatBSB('062-000')).toBe('062-000')
  })

  it('formats BSB with spaces', () => {
    expect(formatBSB('062 000')).toBe('062-000')
  })

  it('handles various bank BSBs', () => {
    expect(formatBSB('033001')).toBe('033-001')
    expect(formatBSB('082001')).toBe('082-001')
  })
})

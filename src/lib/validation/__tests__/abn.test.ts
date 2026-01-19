import { describe, it, expect } from 'vitest'
import { validateABN, formatABN } from '../abn'

describe('validateABN', () => {
  describe('valid ABNs', () => {
    it('validates a known valid ABN (51824753556)', () => {
      expect(validateABN('51824753556')).toBe(true)
    })

    it('validates Woolworths ABN (53004085616)', () => {
      expect(validateABN('53004085616')).toBe(true)
    })

    it('validates ABN with spaces', () => {
      expect(validateABN('51 824 753 556')).toBe(true)
    })

    it('validates ABN with formatted spaces (XX XXX XXX XXX)', () => {
      expect(validateABN('53 004 085 616')).toBe(true)
    })
  })

  describe('invalid ABNs', () => {
    it('returns false for empty string', () => {
      expect(validateABN('')).toBe(false)
    })

    it('returns false for ABN with wrong length', () => {
      expect(validateABN('1234567890')).toBe(false)
      expect(validateABN('123456789012')).toBe(false)
    })

    it('returns false for ABN with non-numeric characters', () => {
      expect(validateABN('5182475355a')).toBe(false)
      expect(validateABN('51-824-753-556')).toBe(false)
    })

    it('returns false for invalid checksum', () => {
      expect(validateABN('51824753557')).toBe(false)
      expect(validateABN('12345678901')).toBe(false)
    })

    it('returns false for all zeros', () => {
      expect(validateABN('00000000000')).toBe(false)
    })
  })
})

describe('formatABN', () => {
  it('formats an unformatted ABN', () => {
    expect(formatABN('51824753556')).toBe('51 824 753 556')
  })

  it('reformats an already formatted ABN', () => {
    expect(formatABN('51 824 753 556')).toBe('51 824 753 556')
  })

  it('formats ABN with inconsistent spacing', () => {
    expect(formatABN('51  824753 556')).toBe('51 824 753 556')
  })

  it('handles Woolworths ABN', () => {
    expect(formatABN('53004085616')).toBe('53 004 085 616')
  })
})

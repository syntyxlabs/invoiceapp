/**
 * Validates an Australian Business Number (ABN).
 * ABNs are 11-digit numbers with a specific checksum algorithm.
 *
 * @param abn - The ABN to validate (can include spaces)
 * @returns true if the ABN is valid, false otherwise
 */
export function validateABN(abn: string): boolean {
  // Remove all spaces
  const cleaned = abn.replace(/\s/g, '')

  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(cleaned)) {
    return false
  }

  // ABN validation algorithm:
  // 1. Subtract 1 from the first digit
  // 2. Multiply each digit by its weighting factor
  // 3. Sum the products
  // 4. If divisible by 89, the ABN is valid
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
  const digits = cleaned.split('').map(Number)

  // Subtract 1 from the first digit
  digits[0] -= 1

  // Calculate weighted sum
  const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0)

  return sum % 89 === 0
}

/**
 * Formats an ABN into the standard XX XXX XXX XXX format.
 *
 * @param abn - The ABN to format (can include spaces)
 * @returns The formatted ABN string
 */
export function formatABN(abn: string): string {
  // Remove all spaces
  const cleaned = abn.replace(/\s/g, '')

  // Format as XX XXX XXX XXX
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4')
}

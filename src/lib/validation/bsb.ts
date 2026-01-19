/**
 * Validates a Bank State Branch (BSB) number.
 * BSBs are 6-digit numbers used in Australian banking.
 *
 * @param bsb - The BSB to validate (can include hyphens or spaces)
 * @returns true if the BSB is valid, false otherwise
 */
export function validateBSB(bsb: string): boolean {
  // Remove hyphens and spaces
  const cleaned = bsb.replace(/[-\s]/g, '')

  // Must be exactly 6 digits
  return /^\d{6}$/.test(cleaned)
}

/**
 * Formats a BSB into the standard XXX-XXX format.
 *
 * @param bsb - The BSB to format (can include hyphens or spaces)
 * @returns The formatted BSB string
 */
export function formatBSB(bsb: string): string {
  // Remove hyphens and spaces
  const cleaned = bsb.replace(/[-\s]/g, '')

  // Format as XXX-XXX
  return cleaned.replace(/(\d{3})(\d{3})/, '$1-$2')
}

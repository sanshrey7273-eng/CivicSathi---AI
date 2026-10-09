/**
 * Indian Mobile Phone Number Validation and Normalization
 * 
 * Rules:
 * 1. Treat +91 as a separate country-code prefix; validate only the user's 10-digit mobile number.
 * 2. Trim whitespace and allow only numeric digits in the mobile number.
 * 3. Do not accidentally validate the combined string '+917020973876' as if it must contain exactly 10 digits.
 * 4. For Indian mobile numbers, require exactly 10 digits and validate that the first digit is 6, 7, 8, or 9.
 */

import type { Language } from '../types';

/**
 * Sanitizes input text into a clean 10-digit mobile number string.
 * Strips whitespace, common delimiters, leading '+91' or '91' country code,
 * or leading '0' trunk prefix, and limits length to 10 numeric digits.
 */
export function sanitizeIndianMobileInput(raw: string): string {
  if (!raw) return '';
  let clean = raw.trim();

  // Remove common punctuation: spaces, hyphens, parentheses, dots
  clean = clean.replace(/[\s\-\(\)\.]/g, '');

  // Strip country code prefix (+91 or +)
  if (clean.startsWith('+91')) {
    clean = clean.slice(3);
  } else if (clean.startsWith('+')) {
    clean = clean.slice(1);
  }

  // Strip '91' prefix if 12 digits were entered
  if (clean.length > 10 && clean.startsWith('91')) {
    clean = clean.slice(2);
  }

  // Strip '0' trunk prefix if 11 digits were entered
  if (clean.length > 10 && clean.startsWith('0')) {
    clean = clean.slice(1);
  }

  // Remove all remaining non-numeric characters
  clean = clean.replace(/\D/g, '');

  // Return at most 10 digits
  return clean.slice(0, 10);
}

/**
 * Validates an Indian mobile number.
 * Returns isValid: true and the normalized 10-digit number if valid.
 */
export function validateIndianMobile(raw: string): {
  isValid: boolean;
  normalized: string;
  errorReason?: 'EMPTY' | 'CONTAINS_LETTERS' | 'SHORT' | 'INVALID_START' | 'INVALID_LENGTH';
} {
  if (!raw) {
    return { isValid: false, normalized: '', errorReason: 'EMPTY' };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { isValid: false, normalized: '', errorReason: 'EMPTY' };
  }

  // Check if raw input contains alphabetic characters
  if (/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, normalized: trimmed, errorReason: 'CONTAINS_LETTERS' };
  }

  // Normalize delimiters and extract country prefix
  let digits = trimmed.replace(/[\s\-\(\)\.]/g, '');
  if (digits.startsWith('+91')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  if (digits.length > 10 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length > 10 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Check for non-numeric characters
  if (/\D/.test(digits)) {
    return { isValid: false, normalized: digits, errorReason: 'CONTAINS_LETTERS' };
  }

  if (digits.length < 10) {
    return { isValid: false, normalized: digits, errorReason: 'SHORT' };
  }

  if (digits.length > 10) {
    return { isValid: false, normalized: digits, errorReason: 'INVALID_LENGTH' };
  }

  // Check valid starting digit (6, 7, 8, or 9)
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { isValid: false, normalized: digits, errorReason: 'INVALID_START' };
  }

  return { isValid: true, normalized: digits };
}

/**
 * Convenience boolean helper for Indian mobile number validation.
 */
export function isValidIndianMobile(raw: string): boolean {
  return validateIndianMobile(raw).isValid;
}

/**
 * Localized error messages for invalid phone numbers.
 */
export function getPhoneErrorMessage(lang: Language): string {
  if (lang === 'hi') {
    return 'कृपया वैध १०-अंकी भारतीय मोबाइल नंबर प्रविष्ट करा.';
  }
  if (lang === 'mr') {
    return 'कृपया वैध १०-अंकी भारतीय मोबाईल नंबर प्रविष्ट करा.';
  }
  return 'Please enter a valid 10-digit Indian mobile number.';
}

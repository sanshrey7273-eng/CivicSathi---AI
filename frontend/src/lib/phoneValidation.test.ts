import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  sanitizeIndianMobileInput,
  validateIndianMobile,
  isValidIndianMobile,
  getPhoneErrorMessage
} from './phoneValidation.ts';

describe('Indian Mobile Phone Validation', () => {
  it('validates 7020973876 as valid 10-digit Indian mobile number', () => {
    const result = validateIndianMobile('7020973876');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.normalized, '7020973876');
    assert.strictEqual(isValidIndianMobile('7020973876'), true);
  });

  it('handles +91 country prefix as separate code without validating 13 chars', () => {
    const result = validateIndianMobile('+917020973876');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.normalized, '7020973876');

    const resultWithSpace = validateIndianMobile('+91 7020973876');
    assert.strictEqual(resultWithSpace.isValid, true);
    assert.strictEqual(resultWithSpace.normalized, '7020973876');
  });

  it('trims whitespace cleanly', () => {
    const result = validateIndianMobile('   7020973876   ');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.normalized, '7020973876');
  });

  it('rejects short numbers like 70209', () => {
    const result = validateIndianMobile('70209');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.errorReason, 'SHORT');
    assert.strictEqual(isValidIndianMobile('70209'), false);
  });

  it('rejects inputs containing letters like 70209abc76 and abcdefghij', () => {
    const res1 = validateIndianMobile('70209abc76');
    assert.strictEqual(res1.isValid, false);
    assert.strictEqual(res1.errorReason, 'CONTAINS_LETTERS');
    assert.strictEqual(isValidIndianMobile('70209abc76'), false);

    const res2 = validateIndianMobile('abcdefghij');
    assert.strictEqual(res2.isValid, false);
    assert.strictEqual(res2.errorReason, 'CONTAINS_LETTERS');
    assert.strictEqual(isValidIndianMobile('abcdefghij'), false);
  });

  it('rejects numbers starting with digits other than 6, 7, 8, 9', () => {
    const start5 = validateIndianMobile('5020973876');
    assert.strictEqual(start5.isValid, false);
    assert.strictEqual(start5.errorReason, 'INVALID_START');

    const start1 = validateIndianMobile('1234567890');
    assert.strictEqual(start1.isValid, false);
    assert.strictEqual(start1.errorReason, 'INVALID_START');

    const start4 = validateIndianMobile('4987654321');
    assert.strictEqual(start4.isValid, false);
    assert.strictEqual(start4.errorReason, 'INVALID_START');
  });

  it('accepts valid numbers starting with 6, 8, 9 as well', () => {
    assert.strictEqual(isValidIndianMobile('6123456789'), true);
    assert.strictEqual(isValidIndianMobile('8123456789'), true);
    assert.strictEqual(isValidIndianMobile('9822012345'), true);
  });

  it('sanitizes input strings correctly', () => {
    assert.strictEqual(sanitizeIndianMobileInput('7020973876'), '7020973876');
    assert.strictEqual(sanitizeIndianMobileInput('+91 7020973876'), '7020973876');
    assert.strictEqual(sanitizeIndianMobileInput('+917020973876'), '7020973876');
    assert.strictEqual(sanitizeIndianMobileInput('07020973876'), '7020973876');
    assert.strictEqual(sanitizeIndianMobileInput(' 70209-73876 '), '7020973876');
  });

  it('provides correct localized error messages in Marathi and Hindi', () => {
    assert.strictEqual(getPhoneErrorMessage('mr'), 'कृपया वैध १०-अंकी भारतीय मोबाईल नंबर प्रविष्ट करा.');
    assert.strictEqual(getPhoneErrorMessage('hi'), 'कृपया वैध १०-अंकी भारतीय मोबाइल नंबर प्रविष्ट करा.');
    assert.strictEqual(getPhoneErrorMessage('en'), 'Please enter a valid 10-digit Indian mobile number.');
  });
});

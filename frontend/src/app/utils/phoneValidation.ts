export interface PhoneValidationRule {
  code: string;
  name: string;
  dialCode: string;
  minDigits: number;
  maxDigits: number;
  pattern?: RegExp;
  patternMessage?: string;
}

export interface PhoneValidationResult {
  isValid: boolean;
  sanitizedNationalNumber: string;
  fullInternationalNumber: string;
  error?: string;
}

const digitsOnly = (value: string) => value.replace(/\D/g, '');

export const sanitizePhoneForCountry = (
  input: string,
  rule: Pick<PhoneValidationRule, 'dialCode' | 'maxDigits'>
) => {
  const allDigits = digitsOnly(input || '');
  const dialDigits = digitsOnly(rule.dialCode);

  let national = allDigits;
  if (dialDigits && allDigits.startsWith(dialDigits) && allDigits.length > rule.maxDigits) {
    national = allDigits.slice(dialDigits.length);
  }

  return national;
};

export const validatePhoneForCountry = (
  input: string,
  rule: PhoneValidationRule
): PhoneValidationResult => {
  const national = sanitizePhoneForCountry(input, rule);
  const fullInternationalNumber = `${rule.dialCode}${national}`;

  if (!national) {
    return {
      isValid: false,
      sanitizedNationalNumber: '',
      fullInternationalNumber,
      error: 'Phone number is required',
    };
  }

  if (national.length < rule.minDigits || national.length > rule.maxDigits) {
    const sameLength = rule.minDigits === rule.maxDigits;
    return {
      isValid: false,
      sanitizedNationalNumber: national,
      fullInternationalNumber,
      error: sameLength
        ? `Phone number must be exactly ${rule.maxDigits} digits for ${rule.name}`
        : `Phone number must be ${rule.minDigits}-${rule.maxDigits} digits for ${rule.name}`,
    };
  }

  if (rule.pattern && !rule.pattern.test(national)) {
    return {
      isValid: false,
      sanitizedNationalNumber: national,
      fullInternationalNumber,
      error: rule.patternMessage || `Invalid phone number format for ${rule.name}`,
    };
  }

  return {
    isValid: true,
    sanitizedNationalNumber: national,
    fullInternationalNumber,
  };
};

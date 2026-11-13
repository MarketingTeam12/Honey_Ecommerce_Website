export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  isValid: boolean;
  message: string;
}

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Validates that a password meets the site policy:
 * minimum 8 characters, at least one letter, and at least one number.
 */
export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const value = String(password || '');
  const hasMinLength = value.length >= MIN_PASSWORD_LENGTH;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const isValid = hasMinLength && hasLetter && hasNumber;

  let message = '';
  if (!hasMinLength) {
    message = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  } else if (!hasLetter || !hasNumber) {
    message = 'Password must include at least one letter and one number';
  }

  return {
    hasMinLength,
    hasLetter,
    hasNumber,
    isValid,
    message,
  };
}

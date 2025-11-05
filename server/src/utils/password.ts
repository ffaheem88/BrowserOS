import bcrypt from 'bcrypt';
import { z } from 'zod';

// Cost factor for bcrypt (higher = more secure but slower)
// 12 is a good balance between security and performance
const SALT_ROUNDS = 12;

/**
 * Password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Validate password meets requirements
    passwordSchema.parse(password);

    // Generate salt and hash
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw error;
  }
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    return false;
  }
}

/**
 * Calculate password strength score (0-100)
 * @param password - Plain text password
 * @returns Strength score and feedback
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score += 20;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add numbers');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add special characters');
  }

  // Common patterns penalty
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeated characters');
  }

  if (/^[0-9]+$/.test(password)) {
    score -= 20;
    feedback.push('Use a mix of characters, not just numbers');
  }

  if (/^[a-z]+$/i.test(password)) {
    score -= 20;
    feedback.push('Use a mix of characters, not just letters');
  }

  // Common passwords check (basic)
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'letmein'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score = Math.max(0, score - 30);
    feedback.push('Avoid common passwords');
  }

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  if (score >= 80 && feedback.length === 0) {
    feedback.push('Strong password!');
  } else if (score >= 60) {
    feedback.push('Good password, but could be stronger');
  } else if (score >= 40) {
    feedback.push('Weak password, consider making it stronger');
  } else {
    feedback.push('Very weak password, please strengthen it');
  }

  return { score, feedback };
}

/**
 * Validate password meets minimum requirements
 * @param password - Plain text password
 * @returns Validation result
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const result = passwordSchema.safeParse(password);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.error.errors.map(err => err.message),
  };
}

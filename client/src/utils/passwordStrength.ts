export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
}

/**
 * Evaluates password strength based on various criteria
 * @param password - The password to evaluate
 * @returns Password strength result with score and feedback
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const feedback: string[] = [];

  if (!password) {
    return {
      strength: 'weak',
      score: 0,
      feedback: ['Password is required'],
    };
  }

  // Length check
  if (password.length >= 8) {
    score += 20;
  } else {
    feedback.push('Password should be at least 8 characters');
  }

  if (password.length >= 12) {
    score += 10;
  }

  // Lowercase letters
  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Uppercase letters
  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Numbers
  if (/\d/.test(password)) {
    score += 20;
  } else {
    feedback.push('Add numbers');
  }

  // Special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Add special characters');
  }

  // Variety bonus
  const uniqueChars = new Set(password.split('')).size;
  if (uniqueChars >= password.length * 0.7) {
    score += 10;
  }

  // Determine strength level
  let strength: PasswordStrength;
  if (score >= 80) {
    strength = 'strong';
  } else if (score >= 60) {
    strength = 'good';
  } else if (score >= 40) {
    strength = 'fair';
  } else {
    strength = 'weak';
  }

  return {
    strength,
    score: Math.min(score, 100),
    feedback: feedback.length > 0 ? feedback : ['Password meets requirements'],
  };
}

/**
 * Validates if password meets minimum requirements
 * @param password - The password to validate
 * @returns True if password is valid
 */
export function isPasswordValid(password: string): boolean {
  const result = evaluatePasswordStrength(password);
  return result.score >= 40 && password.length >= 8;
}

/**
 * Gets color class based on password strength
 * @param strength - Password strength level
 * @returns Tailwind color class
 */
export function getStrengthColor(strength: PasswordStrength): string {
  const colors = {
    weak: 'bg-red-500',
    fair: 'bg-orange-500',
    good: 'bg-yellow-500',
    strong: 'bg-green-500',
  };
  return colors[strength];
}

/**
 * Gets text color class based on password strength
 * @param strength - Password strength level
 * @returns Tailwind text color class
 */
export function getStrengthTextColor(strength: PasswordStrength): string {
  const colors = {
    weak: 'text-red-600 dark:text-red-400',
    fair: 'text-orange-600 dark:text-orange-400',
    good: 'text-yellow-600 dark:text-yellow-400',
    strong: 'text-green-600 dark:text-green-400',
  };
  return colors[strength];
}

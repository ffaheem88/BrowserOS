import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PasswordStrengthIndicator } from '../../../components/ui/PasswordStrengthIndicator';
import { RegisterData } from '../../../../../shared/types';
import { isPasswordValid } from '../../../utils/passwordStrength';

export interface RegisterFormProps {
  onSubmit: (data: RegisterData) => Promise<void>;
  isLoading: boolean;
  error?: string;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSubmit, isLoading, error, onSwitchToLogin }: RegisterFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: {
      displayName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Display name validation
    if (!displayName) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    } else if (displayName.length > 50) {
      newErrors.displayName = 'Display name must be less than 50 characters';
    }

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid(password)) {
      newErrors.password = 'Password does not meet minimum requirements';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({ displayName, email, password });
    } catch (err) {
      // Error is handled by parent component
      console.error('Registration error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Server error message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 text-sm animate-fade-in">
          <p className="font-medium">Registration failed</p>
          <p className="text-xs mt-1 opacity-90">{error}</p>
        </div>
      )}

      {/* Display name field */}
      <div className="relative">
        <div className="absolute left-3 top-[34px] transform -translate-y-1/2 text-muted-foreground pointer-events-none">
          <User className="h-4 w-4" />
        </div>
        <Input
          label="Display Name"
          type="text"
          placeholder="John Doe"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            if (errors.displayName) setErrors({ ...errors, displayName: undefined });
          }}
          error={errors.displayName}
          className="pl-10"
          autoComplete="name"
          autoFocus
          disabled={isLoading}
          required
        />
      </div>

      {/* Email field */}
      <div className="relative">
        <div className="absolute left-3 top-[34px] transform -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Mail className="h-4 w-4" />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: undefined });
          }}
          error={errors.email}
          className="pl-10"
          autoComplete="email"
          disabled={isLoading}
          required
        />
      </div>

      {/* Password field */}
      <div className="relative">
        <div className="absolute left-3 top-[34px] transform -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Lock className="h-4 w-4" />
        </div>
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors({ ...errors, password: undefined });
          }}
          error={errors.password}
          className="pl-10 pr-10"
          autoComplete="new-password"
          disabled={isLoading}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[34px] transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          disabled={isLoading}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Password strength indicator */}
      {password && (
        <PasswordStrengthIndicator password={password} className="animate-fade-in" />
      )}

      {/* Confirm password field */}
      <div className="relative">
        <div className="absolute left-3 top-[34px] transform -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Lock className="h-4 w-4" />
        </div>
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
          }}
          error={errors.confirmPassword}
          className="pl-10 pr-10"
          autoComplete="new-password"
          disabled={isLoading}
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-[34px] transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          disabled={isLoading}
        >
          {showConfirmPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Terms and conditions */}
      <p className="text-xs text-muted-foreground">
        By creating an account, you agree to our{' '}
        <button
          type="button"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
          disabled={isLoading}
        >
          Terms of Service
        </button>{' '}
        and{' '}
        <button
          type="button"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
          disabled={isLoading}
        >
          Privacy Policy
        </button>
      </p>

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>

      {/* Switch to login */}
      {onSwitchToLogin && (
        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </form>
  );
}

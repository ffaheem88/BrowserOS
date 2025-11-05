import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm, RegisterFormProps } from './RegisterForm';

// Mock the password strength utility
vi.mock('../../../utils/passwordStrength', () => ({
  isPasswordValid: (password: string) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  },
  evaluatePasswordStrength: (password: string) => {
    if (password.length < 8) {
      return { strength: 'weak' as const, score: 0, feedback: ['Password should be at least 8 characters'] };
    }
    if (password.length >= 12) {
      return { strength: 'strong' as const, score: 100, feedback: ['Password meets requirements'] };
    }
    return { strength: 'fair' as const, score: 50, feedback: ['Password meets requirements'] };
  },
  getStrengthColor: (strength: string) => {
    const colors: Record<string, string> = {
      weak: 'bg-red-500',
      fair: 'bg-orange-500',
      good: 'bg-yellow-500',
      strong: 'bg-green-500',
    };
    return colors[strength] || 'bg-gray-500';
  },
  getStrengthTextColor: (strength: string) => {
    const colors: Record<string, string> = {
      weak: 'text-red-600 dark:text-red-400',
      fair: 'text-orange-600 dark:text-orange-400',
      good: 'text-yellow-600 dark:text-yellow-400',
      strong: 'text-green-600 dark:text-green-400',
    };
    return colors[strength] || 'text-gray-600';
  },
}));

describe('RegisterForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  const defaultProps: RegisterFormProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
    error: undefined,
    onSwitchToLogin: mockOnSwitchToLogin,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render display name field with placeholder', () => {
      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByPlaceholderText(/john doe/i);
      expect(displayNameInput).toBeInTheDocument();
    });

    it('should render email field with placeholder', () => {
      render(<RegisterForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('should render password field with placeholder', () => {
      render(<RegisterForm {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
      expect(passwordInput).toBeInTheDocument();
    });

    it('should render confirm password field with placeholder', () => {
      render(<RegisterForm {...defaultProps} />);

      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
      expect(confirmPasswordInput).toBeInTheDocument();
    });

    it('should render terms and conditions text', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByText(/by creating an account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /terms of service/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /privacy policy/i })).toBeInTheDocument();
    });

    it('should render switch to login button when provided', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should not render switch to login button when not provided', () => {
      render(<RegisterForm {...defaultProps} onSwitchToLogin={undefined} />);

      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    });

    it('should render error message when error prop is provided', () => {
      render(<RegisterForm {...defaultProps} error="Email already exists" />);

      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });

    it('should not render error message when error prop is undefined', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.queryByText(/registration failed/i)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should update display name field when user types', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'John Doe');

      expect(displayNameInput).toHaveValue('John Doe');
    });

    it('should update email field when user types', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password field when user types', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'Password123');

      expect(passwordInput).toHaveValue('Password123');
    });

    it('should update confirm password field when user types', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'Password123');

      expect(confirmPasswordInput).toHaveValue('Password123');
    });

    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Get the toggle buttons (there are two, one for password, one for confirm)
      const toggleButtons = screen.getAllByRole('button', { name: '' });
      await user.click(toggleButtons[0]);

      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle confirm password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      await user.click(toggleButtons[1]);

      expect(confirmPasswordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButtons[1]);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    it('should call onSwitchToLogin when sign in button is clicked', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      expect(mockOnSwitchToLogin).toHaveBeenCalledOnce();
    });
  });

  describe('Form Validation', () => {
    it('should show error when display name is empty and form is submitted', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when display name is too short', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'J');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/display name must be at least 2 characters/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when display name is too long', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'a'.repeat(51));

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/display name must be less than 50 characters/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'John Doe');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when email is invalid', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when password does not meet requirements', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'weak');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password does not meet minimum requirements/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when confirm password is empty', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'Password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'Password123');

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'DifferentPassword123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear display name error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      // Submit to trigger validation
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
      });

      // Start typing
      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'J');

      await waitFor(() => {
        expect(screen.queryByText(/display name is required/i)).not.toBeInTheDocument();
      });
    });

    it('should clear email error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'John Doe');

      // Submit to trigger validation
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Start typing
      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 't');

      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data when form is valid', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<RegisterForm {...defaultProps} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.type(displayNameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'Password123');

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'Password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          displayName: 'John Doe',
          email: 'test@example.com',
          password: 'Password123',
        });
      });
    });

    it('should not submit form when validation fails', async () => {
      const user = userEvent.setup();
      render(<RegisterForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading text when isLoading is true', () => {
      render(<RegisterForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();
    });

    it('should disable all inputs when isLoading is true', () => {
      render(<RegisterForm {...defaultProps} isLoading={true} />);

      expect(screen.getByLabelText(/display name/i)).toBeDisabled();
      expect(screen.getByLabelText(/^email$/i)).toBeDisabled();
      expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
      expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    it('should disable terms and conditions buttons when isLoading is true', () => {
      render(<RegisterForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /terms of service/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /privacy policy/i })).toBeDisabled();
    });

    it('should disable switch to login button when isLoading is true', () => {
      render(<RegisterForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper autocomplete attributes', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByLabelText(/display name/i)).toHaveAttribute('autocomplete', 'name');
      expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
        'autocomplete',
        'new-password'
      );
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
        'autocomplete',
        'new-password'
      );
    });

    it('should mark all required fields as required', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByLabelText(/display name/i)).toBeRequired();
      expect(screen.getByLabelText(/^email$/i)).toBeRequired();
      expect(screen.getByLabelText(/^password$/i)).toBeRequired();
      expect(screen.getByLabelText(/confirm password/i)).toBeRequired();
    });

    it('should focus display name input on mount', () => {
      render(<RegisterForm {...defaultProps} />);

      expect(screen.getByLabelText(/display name/i)).toHaveFocus();
    });
  });
});

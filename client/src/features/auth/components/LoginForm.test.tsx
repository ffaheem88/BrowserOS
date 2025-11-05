import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm, LoginFormProps } from './LoginForm';

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSwitchToRegister = vi.fn();

  const defaultProps: LoginFormProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
    error: undefined,
    onSwitchToRegister: mockOnSwitchToRegister,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render email field with placeholder', () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('should render password field with placeholder', () => {
      render(<LoginForm {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      expect(passwordInput).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
    });

    it('should render switch to register button when provided', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should not render switch to register button when not provided', () => {
      render(<LoginForm {...defaultProps} onSwitchToRegister={undefined} />);

      expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument();
    });

    it('should render error message when error prop is provided', () => {
      render(<LoginForm {...defaultProps} error="Invalid credentials" />);

      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    it('should not render error message when error prop is undefined', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should update email field when user types', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password field when user types', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('should toggle remember me checkbox', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /remember me/i });
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: '' });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should call onSwitchToRegister when create account button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const createAccountButton = screen.getByRole('button', { name: /create account/i });
      await user.click(createAccountButton);

      expect(mockOnSwitchToRegister).toHaveBeenCalledOnce();
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty and form is submitted', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when email is invalid', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when password is less than 6 characters', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, '12345');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear email error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      // Submit to trigger validation
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Start typing
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 't');

      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });

    it('should clear password error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      // Submit to trigger validation
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      // Start typing
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'p');

      await waitFor(() => {
        expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data when form is valid', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: false,
        });
      });
    });

    it('should call onSubmit with rememberMe true when checkbox is checked', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      const checkbox = screen.getByRole('checkbox', { name: /remember me/i });
      await user.click(checkbox);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: true,
        });
      });
    });

    it('should not submit form when validation fails', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading text when isLoading is true', () => {
      render(<LoginForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    });

    it('should disable all inputs when isLoading is true', () => {
      render(<LoginForm {...defaultProps} isLoading={true} />);

      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
      expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    it('should disable forgot password button when isLoading is true', () => {
      render(<LoginForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /forgot password/i })).toBeDisabled();
    });

    it('should disable switch to register button when isLoading is true', () => {
      render(<LoginForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper autocomplete attributes', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        'autocomplete',
        'current-password'
      );
    });

    it('should mark email as required', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByLabelText(/email/i)).toBeRequired();
    });

    it('should mark password as required', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByLabelText(/password/i)).toBeRequired();
    });

    it('should focus email input on mount', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByLabelText(/email/i)).toHaveFocus();
    });
  });
});

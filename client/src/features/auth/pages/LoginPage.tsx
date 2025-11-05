import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { LoginCredentials } from '../../../../../shared/types';

export function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(undefined);

    try {
      // TODO: Replace with actual authentication service call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate authentication error for demo
      if (credentials.email === 'error@test.com') {
        throw new Error('Invalid email or password');
      }

      // On success, navigate to desktop
      console.log('Login successful:', credentials);
      navigate('/desktop');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    navigate('/auth/register');
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your BrowserOS account"
    >
      <LoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
        onSwitchToRegister={handleSwitchToRegister}
      />
    </AuthLayout>
  );
}

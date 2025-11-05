import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { LoginCredentials } from '../../../../../shared/types';
import { authService } from '../../../services';
import { setUser } from '../../../utils/tokenStorage';

export function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Call actual authentication API
      const response = await authService.login(credentials);

      // Store user data
      setUser(response.user);

      // On success, navigate to desktop
      console.log('Login successful:', response.user);
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

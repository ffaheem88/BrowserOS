import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import { RegisterData } from '../../../../../shared/types';
import { authService } from '../../../services';
import { setUser } from '../../../utils/tokenStorage';

export function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleRegister = async (data: RegisterData) => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Call actual authentication API
      const response = await authService.register(data);

      // Store user data
      setUser(response.user);

      // On success, navigate to desktop
      console.log('Registration successful:', response.user);
      navigate('/desktop');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    navigate('/auth/login');
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get started with BrowserOS today"
    >
      <RegisterForm
        onSubmit={handleRegister}
        isLoading={isLoading}
        error={error}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </AuthLayout>
  );
}

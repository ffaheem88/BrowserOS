import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import { RegisterData } from '../../../../../shared/types';

export function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleRegister = async (data: RegisterData) => {
    setIsLoading(true);
    setError(undefined);

    try {
      // TODO: Replace with actual authentication service call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate duplicate email error for demo
      if (data.email === 'exists@test.com') {
        throw new Error('An account with this email already exists');
      }

      // On success, navigate to desktop or login
      console.log('Registration successful:', data);
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

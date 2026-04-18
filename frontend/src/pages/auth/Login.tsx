import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface LoginForm {
  username: string;
  password: string;
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, user } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await login({ username: data.username, password: data.password });
      console.log('[LOGIN] Login response:', response);
      
      toast.success('Login successful!');
      
      // Use user from response or context
      const userRole = user?.role;
      console.log('[LOGIN] User role from context:', userRole);
      
      if (userRole) {
        const redirectPath = getDashboardPath(userRole);
        console.log('[LOGIN] Redirecting to:', redirectPath);
        navigate(redirectPath);
      } else {
        setError('User info not available after login.');
      }
    } catch (err: any) {
      // Safely extract error message
      let errorMessage = 'Login failed. Please try again.';
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('[LOGIN] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardPath = (role: string) => {
    switch (role) {
      case 'DEVELOPER':
        return '/developer';
      case 'PRINCIPAL':
        return '/principal';
      case 'TEACHER':
        return '/teacher';
      case 'STUDENT':
        return '/student';
      case 'PARENT':
        return '/parent';
      default:
        return '/dashboard';
    }
  };

  const demoCredentials = [
    { role: 'Developer', username: 'admin', password: 'admin123' },
    { role: 'Principal', username: 'principal', password: 'principal123' },
    { role: 'Teacher', username: 'teacher1', password: 'teacher123' },
    { role: 'Student', username: 'student1', password: 'student123' },
    { role: 'Parent', username: 'parent1', password: 'parent123' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your School LMS account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username or Email</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username or email"
                  {...register('username', { 
                    required: 'Username or emai; is required',
                    minLength: { value: 3, message: 'Username must be at least 3 characters' }
                  })}
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && (
                  <p className="text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Demo Accounts:</h4>
              <div className="space-y-1 text-xs text-gray-600">
                {demoCredentials.map((cred, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="font-medium">{cred.role}:</span>
                    <span>{cred.username} / {cred.password}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <div className="text-center w-full">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
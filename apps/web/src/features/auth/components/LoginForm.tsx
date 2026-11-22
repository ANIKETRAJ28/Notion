import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useLogin } from '../hooks/use-auth-mutations';
import { type loginForm, loginSchema } from '../schema/auth.schema';

export function LoginForm() {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<loginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: loginForm) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        navigate('/');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>

        <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />

        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>

        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          {...register('password')}
        />

        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {loginMutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {loginMutation.error.message || 'Unable to log in. Please try again.'}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? 'Logging in...' : 'Log in'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}

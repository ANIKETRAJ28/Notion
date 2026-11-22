import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useRegister } from '../hooks/use-auth-mutations';
import { type registerForm, registerSchema } from '../schema/auth.schema';

export function RegisterForm() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<registerForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
    },
  });

  const onSubmit = (values: registerForm) => {
    registerMutation.mutate(values, {
      onSuccess: () => navigate('/'),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" placeholder="John Doe" autoComplete="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

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
          placeholder="Create a password"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {registerMutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {registerMutation.error.message || 'Unable to create your account. Please try again.'}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

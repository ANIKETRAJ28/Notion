import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { RegisterForm } from '../components/RegisterForm';

export function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>

          <CardDescription>Get started with your own workspace.</CardDescription>
        </CardHeader>

        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </main>
  );
}

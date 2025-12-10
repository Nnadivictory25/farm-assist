import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { Logo } from '@/components/logo'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/lib/auth-client'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/sign-in')({
  component: AuthPage,
  beforeLoad: async () => {
    const session = await authClient.getSession()

    if (session && session.data?.user) {
      throw redirect({ to: '/dashboard' })
    }
  },
})

function AuthPage() {
  const navigate = useNavigate()
  const { refetch } = useSession()
  const [isSignUp, setIsSignUp] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    if (isSignUp) {
      const { data, error } = await authClient.signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      setIsLoading(false)

      if (error) {
        console.error('🔴 Sign up error:', error)
        toast.error(error.message)
        return
      }

      if (data) {
        toast.success('🎉 Account created successfully')
        await refetch()
        navigate({ to: '/dashboard' })
      }
    } else {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: true,
      })

      setIsLoading(false)

      if (error) {
        console.error('🔴 Sign in error:', error)
        toast.error(error.message)
        return
      }

      if (data) {
        toast.success('🎉 Signed in successfully')
        await refetch()
        navigate({ to: '/dashboard' })
      }
    }
  }

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center px-5">
      <Card className="w-full max-w-md opacity-0 animate-fade-in-up">
        <CardHeader className="text-center">
          <Logo className="text-2xl" />
          <CardDescription>
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? isSignUp
                  ? 'Creating account...'
                  : 'Logging in...'
                : isSignUp
                  ? 'Create Account'
                  : 'Log in'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? 'Log in' : 'Create account'}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

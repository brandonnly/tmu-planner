import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Turnstile } from '@marsidev/react-turnstile'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GoogleIcon } from '@/components/icons/google'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from '@supabase/supabase-js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut } from 'lucide-react'
import { Toaster, toast } from 'sonner'

function UserMenu({ user }: { user: User }) {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error.message)
      toast.error('Failed to sign out')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 py-6">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />
            <AvatarFallback>{user.user_metadata.full_name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-normal">{user.user_metadata.full_name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LoginDialog() {
  const [verified, setVerified] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null
      setUser(newUser)
      if (newUser) {
        toast.success(`Welcome, ${newUser.user_metadata.full_name}!`)
      } else {
        toast.success('Signed out successfully')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('Error signing in with Google:', error.message)
      toast.error('Failed to sign in with Google')
    }
  }

  if (user) {
    return <UserMenu user={user} />
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Login</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login to TMU Planner</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            onSuccess={() => setVerified(true)}
            onError={() => setVerified(false)}
            onExpire={() => setVerified(false)}
          />
          <Button
            disabled={!verified}
            variant="outline"
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium border-gray-200"
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon />
            <span>Sign in with Google</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex gap-4 text-xl border-b p-4 items-center">
        <div className="font-bold text-xl mr-4 flex items-center gap-3">
          <img src="/Logo.png" alt="TMU Planner Logo" className="h-8 w-8" />
          TMU Planner
        </div>
        <div className="flex-1" />
        <LoginDialog />
        <ThemeToggle />
      </div>
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
      <Toaster />
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}

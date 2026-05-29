import AuthForm from '@/components/AuthForm'

export const metadata = {
  title: 'Sign in — Skill Tracker',
  description: 'Sign in to your Skill Tracker account',
  alternates: {
    canonical: '/login', // Explicitly points to its own sub-path
  },
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <AuthForm />
    </main>
  )
}
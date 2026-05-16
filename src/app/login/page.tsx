import AuthForm from '@/components/AuthForm'

export const metadata = {
  title: 'Sign in — Skill Tracker',
  description: 'Sign in to your Skill Tracker account',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <AuthForm />
    </main>
  )
}
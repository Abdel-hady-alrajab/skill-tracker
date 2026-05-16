import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 'next' lets you redirect somewhere specific after login (optional)
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to dashboard (or wherever 'next' points)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — send to login with an error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
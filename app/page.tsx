import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function Home() {
  // Check if the user is authenticated
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  const isLoggedIn = cookieStore.get('is_logged_in')?.value === 'true'

  // If the user is authenticated, redirect to dashboard
  if (token && isLoggedIn) {
    redirect('/dashboard')
  }

  // Otherwise, redirect to login
  redirect('/login')
}

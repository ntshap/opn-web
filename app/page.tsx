import { redirect } from 'next/navigation'

// Root page - always redirect to login
export default function Home() {
  // Always redirect to login page first
  // The login page will redirect to dashboard if the user is already authenticated
  redirect('/login')
}

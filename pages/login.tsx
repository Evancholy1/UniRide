import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
  
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
  
    if (error) {
      setError(error.message)
    } else {
      // ✅ Add this: wait before redirecting so Supabase can store session
      setTimeout(() => {
        router.push('/')
      }, 500)
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow w-80">
        <h2 className="text-2xl mb-4 font-bold">Login</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <input
          className="w-full border p-2 rounded mb-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded mb-4"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          Log In
        </button>
        <p className="text-sm mt-4 text-center">
          Don’t have an account? <a href="/register" className="text-green-600 underline">Sign up</a>
        </p>
      </form>
    </div>
  )
}

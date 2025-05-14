import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Step 1: Sign up with Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    const user = signUpData.user

    // Step 2: Insert into custom users table (must match foreign key constraint)
    if (user) {
      const { error: insertError } = await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        name: name,
        verified: false,
      })

      if (insertError) {
        console.error('Insert error:', insertError)
        console.log('Tried inserting user with ID:', user.id)

        setError('Account created, but failed to save profile info.')
        return
      }

      // Optional: wait to ensure session sync before redirect
      await new Promise(res => setTimeout(res, 500))
      router.push('/')
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow w-80">
        <h2 className="text-2xl font-bold mb-4">Create Account</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <input
          className="w-full border p-2 rounded mb-2"
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

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

        <button type="submit" className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
          Sign Up
        </button>

        <p className="text-sm mt-4 text-center">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  )
}

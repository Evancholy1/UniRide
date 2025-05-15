import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-96 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Create Account</h2>
        <p className="text-gray-400 text-center mb-6">Join UniRide to start sharing rides</p>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors duration-200 mt-6"
          >
            Sign Up
          </button>
        </form>
        
        <p className="text-sm mt-6 text-center text-gray-300">
          Already have an account?{' '}
          <a href="/login" className="text-blue-500 hover:text-blue-400 transition-colors duration-200">
            Log in
          </a>
        </p>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { motion, AnimatePresence } from 'framer-motion'
import { IconCopy } from '@tabler/icons-react'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showUserId, setShowUserId] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/login')
          return
        }

        // Try to get existing profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authUser.id,
                name: authUser.user_metadata?.full_name || '',
                email: authUser.email,
                avatar_url: null
              }
            ])
            .select()
            .single()

          if (createError) throw createError
          setUser(newProfile)
          setName(newProfile.name || '')
          setEmail(newProfile.email || '')
        } else if (profileError) {
          throw profileError
        } else if (profile) {
          setUser(profile)
          setName(profile.name || '')
          setEmail(profile.email || '')
          setPreviewUrl(profile.avatar_url)
        }
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setShowImageCropper(true)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageCrop = async () => {
    if (!selectedImage || !previewUrl || !user?.id) {
      setError('User ID is missing. Please try again.');
      return;
    }

    try {
      // Upload to Supabase Storage
      const fileExt = selectedImage.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedImage)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('Profile picture updated successfully!')
      setShowImageCropper(false)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (!user?.id) {
        throw new Error('User not found')
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          name,
          email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update users table (custom)
      const { error: usersTableError } = await supabase
        .from('users')
        .update({
          name,
          email
        })
        .eq('id', user.id)

      if (usersTableError) throw usersTableError

      // Update auth user metadata and email
      const { error: authError } = await supabase.auth.updateUser({ 
        email,
        data: { 
          full_name: name,
          name: name,
          email: email
        }
      })
      if (authError) throw authError

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match')
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        })
        if (passwordError) throw passwordError
      }

      // Refresh user data
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (updatedProfile) {
          setUser(updatedProfile)
          setName(updatedProfile.name || '')
          setEmail(updatedProfile.email || '')
        }
      }

      setSuccess('Profile updated successfully!')
      // Clear password fields
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setError(error.message)
    }
  }

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id)
      setSuccess('User ID copied to clipboard!')
    }
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <button
          onClick={() => setShowUserId(true)}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          Show User ID
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        {/* Profile Picture Section */}
        <div className="flex items-center gap-6">
          <div className="relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-4xl">
                👤
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <div>
            <h3 className="font-medium text-white">Profile Picture</h3>
            <p className="text-sm text-gray-400">Click to change your profile picture</p>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="font-medium mb-4 text-white">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-white">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </form>
      </div>

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {showImageCropper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold mb-4 text-white">Crop Profile Picture</h3>
              <div className="relative w-64 h-64 mx-auto mb-4">
                <div className="absolute inset-0 border-2 border-blue-500 rounded-full pointer-events-none" />
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowImageCropper(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImageCrop}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User ID Modal */}
      <AnimatePresence>
        {showUserId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold mb-4 text-white">Your User ID</h3>
              <div className="bg-gray-700 p-4 rounded-lg mb-4 break-all">
                <p className="text-white font-mono text-sm">{user?.id}</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={copyUserId}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <IconCopy className="h-4 w-4" />
                  Copy
                </button>
                <button
                  onClick={() => setShowUserId(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 
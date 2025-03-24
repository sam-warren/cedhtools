'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase/client'
import { Button } from '@/components/ui/button'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <Button 
      onClick={handleLogout} 
      variant="destructive"
    >
      Logout
    </Button>
  )
} 
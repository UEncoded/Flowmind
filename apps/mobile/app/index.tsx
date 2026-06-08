import { Redirect } from 'expo-router'
import { useAuthStore } from '../src/store/authStore'

export default function Index() {
  const user = useAuthStore(s => s.user)
  return <Redirect href={user ? '/(tabs)/dashboard' : '/login'} />
}

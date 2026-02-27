import type { Database } from "../types/database.types"

type Profile = Database['public']['Tables']['profiles']['Row']

export function getDisplayName(profile: any): string {
  if (!profile) return 'Love'

  if (profile.role === 'king') {
    return 'King Hatim'
  }

  if (profile.role === 'queen') {
    return 'Queen Pookie'
  }

  if (
    profile.username?.includes('hatimhtm2003') ||
    profile.username?.includes('.official')
  ) {
    return 'Love'
  }

  return profile.username || 'Love'
}

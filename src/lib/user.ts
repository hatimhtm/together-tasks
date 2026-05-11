import type { Database } from "../types/database.types"
import { KING_LABEL, QUEEN_LABEL, KING_HANDLES } from "./constants"

type Profile = Database['public']['Tables']['profiles']['Row']

export function getDisplayName(profile: any): string {
    if (!profile) return 'Love'

    if (profile.role === 'king')  return KING_LABEL
    if (profile.role === 'queen') return QUEEN_LABEL

    if (profile.username && KING_HANDLES.some(h => profile.username?.includes(h))) {
        return 'Love'
    }

    return profile.username || 'Love'
}

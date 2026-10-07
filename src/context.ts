import { createContext, useContext } from 'react'
import type { useStore } from './lib/store'

export type Route = 'status' | 'checkin' | 'act' | 'evidence' | 'method' | 'settings'

type Store = ReturnType<typeof useStore>

export interface AppCtx extends Store {
  today: string
  go: (r: Route) => void
  toast: (msg: string) => void
}

export const Ctx = createContext<AppCtx | null>(null)
export const useApp = () => useContext(Ctx)!

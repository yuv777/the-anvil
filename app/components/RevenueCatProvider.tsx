'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { initRevenueCat, getSubscriptionStatus } from '@/lib/revenuecat'

interface SubContext {
  isPro: boolean
  loading: boolean
  recheck: () => void
}

const SubscriptionContext = createContext<SubContext>({ isPro: false, loading: true, recheck: () => {} })

export function useSubscription() {
  return useContext(SubscriptionContext)
}

export default function RevenueCatProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  async function check() {
    await initRevenueCat(userId)
    const status = await getSubscriptionStatus()
    setIsPro(status)
    setLoading(false)
  }

  useEffect(() => { check() }, [userId])

  return (
    <SubscriptionContext.Provider value={{ isPro, loading, recheck: check }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

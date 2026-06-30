import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { Capacitor } from '@capacitor/core'

const API_KEY = 'test_naKoSXydsPiNLhyVqBQflSNkZyf'

export async function initRevenueCat(userId: string) {
  if (!Capacitor.isNativePlatform()) return
  await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR })
  await Purchases.configure({ apiKey: API_KEY, appUserID: userId })
}

export async function getSubscriptionStatus(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const { customerInfo } = await Purchases.getCustomerInfo()
    return typeof customerInfo.entitlements.active['the-anvil Pro'] !== 'undefined'
  } catch {
    return false
  }
}

export async function getOfferings() {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const { current } = await Purchases.getOfferings()
    return current
  } catch {
    return null
  }
}

export async function purchasePackage(pkg: any) {
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
  return typeof customerInfo.entitlements.active['the-anvil Pro'] !== 'undefined'
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.restorePurchases()
    return typeof customerInfo.entitlements.active['the-anvil Pro'] !== 'undefined'
  } catch {
    return false
  }
}

import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AlarmManager from "@/app/components/AlarmManager"
import CookieBanner from "@/app/components/CookieBanner"
import SwipeNavigator from "@/app/components/SwipeNavigator"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "The Anvil",
  description: "Forge your best self.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <head>
        {/* Apply stored theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('anvil-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`
        }} />
      </head>
      <body className="min-h-full antialiased">
        <AlarmManager />
        <CookieBanner />
        <SwipeNavigator>
          {children}
        </SwipeNavigator>
      </body>
    </html>
  )
}

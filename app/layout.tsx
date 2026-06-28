import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AlarmManager from "@/app/components/AlarmManager"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "The Anvil",
  description: "Forge your best self.",
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
        {children}
      </body>
    </html>
  )
}

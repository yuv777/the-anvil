import LegalPage from '@/app/components/LegalPage'

export const metadata = { title: 'Cookie Policy – The Anvil' }

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="29 June 2026"
      intro="This policy explains how The Anvil uses cookies and similar technologies."
      sections={[
        {
          heading: '1. What Are Cookies',
          body: 'Cookies are small text files stored on your device by your browser. They allow websites to remember information about your visit.',
        },
        {
          heading: '2. Cookies We Use',
          body: [
            'Authentication cookies — set by Supabase when you log in. These keep you logged in as you navigate the app. They are session cookies and expire when you log out or your session ends.',
            'Theme preference — stored in localStorage (not a cookie, but a similar technology) to remember your chosen colour theme.',
            'Cookie consent preference — stored in localStorage to remember that you have accepted our cookie notice.',
          ],
        },
        {
          heading: '3. Cookies We Do NOT Use',
          body: [
            'No advertising or tracking cookies.',
            'No analytics cookies (e.g. Google Analytics).',
            'No third-party cookies from social media platforms.',
            'No fingerprinting or cross-site tracking.',
          ],
        },
        {
          heading: '4. Essential Cookies',
          body: 'The authentication cookies we use are strictly necessary for the app to function. Without them, you cannot stay logged in. Because they are essential, they do not require your consent under UK/EU law, though we inform you about them out of transparency.',
        },
        {
          heading: '5. Managing Cookies',
          body: 'You can control cookies through your browser settings. Blocking our authentication cookies will prevent you from logging in. To clear cookies, use your browser\'s privacy or history settings.',
        },
        {
          heading: '6. Changes',
          body: 'If we add new cookies in the future, we will update this policy and notify you.',
        },
      ]}
    />
  )
}

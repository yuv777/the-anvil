import LegalPage from '@/app/components/LegalPage'

export const metadata = { title: 'Privacy Policy – The Anvil' }

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="29 June 2026"
      intro="The Anvil is built to help you grow. We collect only what we need to make the app work, and we never sell your data. This policy explains exactly what we collect, why, and what rights you have over it."
      sections={[
        {
          heading: '1. Who We Are',
          body: 'The Anvil is a habit tracking application. When this policy refers to "we", "us", or "our", it means The Anvil. You can contact us at support@theanvil.app.',
        },
        {
          heading: '2. Data We Collect',
          body: [
            'Email address — used only for login and account recovery.',
            'Username — a display name you choose, shown in leaderboards and squads.',
            'Password — stored as a secure hash. We never see your actual password.',
            'Task completion records — which tasks you completed and on which dates.',
            'Streak and tier data — your current streak, longest streak, and skill tier levels.',
            'Squad data — squads you have joined, squad names, and your rank within them.',
            'Journal entries — text you write in the in-app journal.',
            'Body metrics — weight, sleep, water, and mood data you manually enter.',
            'Progress photos — images you upload to the progress photos feature.',
],
        },
        {
          heading: '3. Data We Do NOT Collect',
          body: [
            'No payment information (the app is currently free).',
            'No location data.',
            'No health data from device sensors or third-party health apps.',
            'No biometric data.',
            'No third-party tracking or advertising.',
            'No data from your contacts, camera, or microphone beyond what you explicitly upload.',
          ],
        },
        {
          heading: '4. How We Use Your Data',
          body: [
            'To provide the app — your task completions, streaks, and tiers are used to display your progress.',
            'To power squads — your username and streak are shown in squad leaderboards.',
            'For authentication — your email is used to log you in and recover your account.',
            'To personalise your experience — your tier level determines which tasks you are assigned.',
            'We do not use your data for advertising, profiling, or AI training.',
          ],
        },
        {
          heading: '5. Data Sharing',
          body: 'We do not sell, rent, or share your personal data with third parties. Your data is stored securely in Supabase (our database provider), hosted on AWS infrastructure in the EU. Supabase processes data under GDPR-compliant terms.',
        },
        {
          heading: '6. Your Rights (GDPR / UK GDPR)',
          body: [
            'Right to access — you can view all your data on the Profile and Analytics pages.',
            'Right to portability — you can download your data as a CSV from Settings → Privacy.',
            'Right to erasure — you can delete your account from Settings → Privacy, which permanently removes all your data.',
            'Right to rectification — you can update your username and email in Settings.',
            'Right to object — contact us at support@theanvil.app to object to any processing.',
            'To exercise any right, contact support@theanvil.app. We will respond within 30 days.',
          ],
        },
        {
          heading: '7. Your Rights (CCPA / CPRA — California)',
          body: [
            'Right to know — this policy describes what we collect and why.',
            'Right to delete — delete your account from Settings → Privacy.',
            'Right to opt-out of sale — we do not sell personal information.',
            'Right to non-discrimination — we will not treat you differently for exercising your rights.',
          ],
        },
        {
          heading: '8. Children\'s Privacy (COPPA)',
          body: 'The Anvil is intended for users aged 18 and over. We do not knowingly collect personal data from anyone under 18. If you believe a minor has created an account, contact us immediately at support@theanvil.app and we will delete the account.',
        },
        {
          heading: '9. Data Retention',
          body: 'We retain your data for as long as your account is active. When you delete your account, all your personal data is permanently deleted within 30 days. Anonymised, aggregated data (e.g. total number of active users) may be retained.',
        },
        {
          heading: '10. Data Breach Notification',
          body: 'In the event of a data breach that poses a risk to your rights and freedoms, we will notify affected users by email within 72 hours of becoming aware of the breach, in compliance with GDPR Article 33.',
        },
        {
          heading: '11. Security',
          body: 'We use industry-standard security measures including password hashing, HTTPS encryption, and row-level security policies that ensure each user can only access their own data. No security system is perfect — if you discover a vulnerability, please report it to support@theanvil.app.',
        },
        {
          heading: '12. Cookies',
          body: 'We use session cookies only for authentication. See our Cookie Policy for full details.',
        },
        {
          heading: '13. Changes to This Policy',
          body: 'If we make material changes to this policy, we will notify you by email and update the "last updated" date. Continued use of the app after changes constitutes acceptance.',
        },
      ]}
    />
  )
}

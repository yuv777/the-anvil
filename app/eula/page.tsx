import LegalPage from '@/app/components/LegalPage'

export const metadata = { title: 'EULA – The Anvil' }

export default function EulaPage() {
  return (
    <LegalPage
      title="End User Licence Agreement"
      lastUpdated="29 June 2026"
      intro="This End User Licence Agreement (EULA) governs your use of The Anvil application. By downloading or using the app, you agree to this agreement."
      sections={[
        {
          heading: '1. Grant of Licence',
          body: 'We grant you a personal, non-exclusive, non-transferable, revocable licence to use The Anvil on your devices for personal, non-commercial purposes, subject to the terms of this agreement.',
        },
        {
          heading: '2. Restrictions',
          body: [
            'You may not copy, modify, or distribute the app or its content.',
            'You may not reverse engineer, decompile, or disassemble the app.',
            'You may not rent, lease, or lend the app to others.',
            'You may not use the app for any commercial purpose without our written consent.',
            'You may not remove any copyright or proprietary notices from the app.',
          ],
        },
        {
          heading: '3. Intellectual Property',
          body: 'The Anvil, including its design, code, content, and branding, is the exclusive property of its creators. This licence does not transfer any ownership rights to you.',
        },
        {
          heading: '4. Updates',
          body: 'We may release updates to the app. By using the app, you agree to receive and install updates. Some updates may be required to continue using the service.',
        },
        {
          heading: '5. Termination',
          body: 'This licence is effective until terminated. It terminates automatically if you violate any of its terms. Upon termination, you must stop using the app and delete all copies from your devices.',
        },
        {
          heading: '6. No Medical Advice',
          body: 'The Anvil does not provide medical, psychological, or health advice. All physical activities are performed at your own risk. Consult a qualified professional before starting any exercise programme.',
        },
        {
          heading: '7. No Guaranteed Results',
          body: 'The Anvil does not guarantee any specific physical, mental, or personal outcomes from using the app. Results vary based on individual effort and circumstances.',
        },
        {
          heading: '8. Disclaimer of Warranties',
          body: 'The app is provided "as is" without warranty of any kind. We do not guarantee the app will be error-free, secure, or available at all times.',
        },
        {
          heading: '9. Limitation of Liability',
          body: 'To the maximum extent permitted by applicable law, we are not liable for any damages arising from your use of the app, including personal injury from physical activities, loss of data, or any other losses.',
        },
        {
          heading: '10. Third-Party Services',
          body: 'The Anvil uses Supabase for data storage. Your use of the app is also subject to Supabase\'s terms and privacy policy. We are not responsible for third-party services.',
        },
        {
          heading: '11. Governing Law',
          body: 'This agreement is governed by the laws of England and Wales.',
        },
        {
          heading: '12. Contact',
          body: 'For any questions about this agreement, contact us at support@theanvil.app.',
        },
      ]}
    />
  )
}

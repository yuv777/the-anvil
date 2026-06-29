import LegalPage from '@/app/components/LegalPage'

export const metadata = { title: 'Terms of Service – The Anvil' }

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="29 June 2026"
      intro="By creating an account and using The Anvil, you agree to these terms. Please read them carefully."
      sections={[
        {
          heading: '1. Acceptance of Terms',
          body: 'By accessing or using The Anvil, you confirm that you are at least 18 years of age and agree to be bound by these Terms of Service. If you do not agree, do not use the app.',
        },
        {
          heading: '2. Age Requirement',
          body: 'The Anvil is for adults only. You must be 18 years of age or older to create an account. By signing up, you confirm you meet this requirement.',
        },
        {
          heading: '3. Your Account',
          body: [
            'You are responsible for keeping your account credentials secure.',
            'You must provide accurate information when creating your account.',
            'You are responsible for all activity that occurs under your account.',
            'You must notify us immediately if you suspect unauthorised access to your account.',
            'You may only have one account.',
          ],
        },
        {
          heading: '4. Acceptable Use',
          body: [
            'You agree not to use the app for any unlawful purpose.',
            'You agree not to attempt to access other users\' data.',
            'You agree not to attempt to reverse engineer, hack, or disrupt the service.',
            'You agree not to create fake accounts or impersonate others.',
            'You agree not to use the app to harass or harm other users.',
          ],
        },
        {
          heading: '5. No Medical Advice',
          body: 'The Anvil is a habit tracking tool only. Nothing in the app constitutes medical, psychological, therapeutic, nutritional, or fitness advice. Always consult a qualified professional before making changes to your diet, exercise, or health routine. You are solely responsible for your own health decisions.',
        },
        {
          heading: '6. No Guaranteed Results',
          body: 'The Anvil does not guarantee any specific outcomes, results, or improvements to your physical, mental, or personal development. Habit tracking is a tool — results depend entirely on your own effort and circumstances.',
        },
        {
          heading: '7. User Responsibility',
          body: 'You are responsible for your own health and safety when performing any physical activities suggested by the app. Physical exercise carries inherent risks. You accept full responsibility for any injury, harm, or adverse outcome that may result from activities you choose to perform.',
        },
        {
          heading: '8. User Content',
          body: 'You retain ownership of content you create in the app (journal entries, progress photos). By submitting content, you grant us a limited licence to store and display it to you within the app. We do not use your content for any other purpose.',
        },
        {
          heading: '9. Termination',
          body: 'You may delete your account at any time from Settings → Privacy. We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, your data will be deleted in accordance with our Privacy Policy.',
        },
        {
          heading: '10. Service Availability',
          body: 'We aim to keep The Anvil available at all times but do not guarantee uninterrupted service. We may perform maintenance, updates, or changes to the service at any time.',
        },
        {
          heading: '11. Limitation of Liability',
          body: 'To the maximum extent permitted by law, The Anvil and its creators are not liable for any indirect, incidental, special, or consequential damages arising from your use of the app, including but not limited to loss of data, personal injury, or loss of profits. Our total liability to you shall not exceed the amount you paid us in the 12 months preceding the claim (which, if you are on the free plan, is zero).',
        },
        {
          heading: '12. Disclaimer of Warranties',
          body: 'The Anvil is provided "as is" and "as available" without any warranties of any kind, express or implied. We do not warrant that the app will be error-free, secure, or continuously available.',
        },
        {
          heading: '13. Changes to Terms',
          body: 'We may update these terms at any time. We will notify you of material changes by email. Continued use of the app after changes constitutes acceptance of the new terms.',
        },
        {
          heading: '14. Governing Law',
          body: 'These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.',
        },
      ]}
    />
  )
}

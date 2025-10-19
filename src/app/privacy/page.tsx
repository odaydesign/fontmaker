import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Privacy Policy - HappyFont',
  description: 'Privacy Policy for HappyFont font creation platform',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
              <p className="text-foreground leading-relaxed">
                HappyFont ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-foreground mb-2">2.1 Account Information</p>
                  <p className="text-foreground mb-2">When you create an account, we collect:</p>
                  <ul className="list-disc pl-6 text-foreground space-y-1">
                    <li>Email address</li>
                    <li>Username</li>
                    <li>Password (encrypted)</li>
                    <li>Profile information (optional)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">2.2 Usage Information</p>
                  <p className="text-foreground mb-2">We automatically collect:</p>
                  <ul className="list-disc pl-6 text-foreground space-y-1">
                    <li>Browser type and version</li>
                    <li>Device information</li>
                    <li>IP address</li>
                    <li>Usage patterns and preferences</li>
                    <li>Font creation and download history</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">2.3 Payment Information</p>
                  <p className="text-foreground">
                    Payment processing is handled by Stripe. We do not store your credit card details.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">2.4 Font Data</p>
                  <p className="text-foreground">
                    We store fonts you create. Public fonts are visible to all users.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. How We Use Your Information</h2>
              <p className="text-foreground mb-4">We use the collected information to:</p>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>Provide, operate, and maintain our Service</li>
                <li>Process transactions and manage subscriptions</li>
                <li>Send updates and promotional materials (with consent)</li>
                <li>Provide customer support</li>
                <li>Improve our Service</li>
                <li>Detect and prevent fraud and technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Security</h2>
              <p className="text-foreground mb-4">
                We implement security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Secure password hashing</li>
                <li>Regular security audits</li>
                <li>Access controls</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Your Rights</h2>
              <p className="text-foreground mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>Access your personal data</li>
                <li>Correct your information</li>
                <li>Request deletion of your account</li>
                <li>Export your fonts and data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Cookies</h2>
              <p className="text-foreground">
                We use cookies for session management, preferences, and analytics. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Contact Us</h2>
              <p className="text-foreground">
                For privacy questions, contact us at: privacy@happyfont.com
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

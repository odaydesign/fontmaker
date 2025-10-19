import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Terms of Service - HappyFont',
  description: 'Terms of Service for HappyFont font creation platform',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-foreground leading-relaxed">
                By accessing and using HappyFont, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-foreground mb-4">
                HappyFont provides a platform for creating custom fonts using AI-generated or user-uploaded images. The Service includes:
              </p>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>Font creation tools and AI image generation</li>
                <li>Font library storage and management</li>
                <li>Community features for sharing fonts</li>
                <li>Token-based usage system</li>
                <li>Subscription plans for enhanced features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. User Accounts</h2>
              <p className="text-foreground mb-4">
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Token System and Payments</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-foreground mb-2">4.1 Tokens</p>
                  <p className="text-foreground mb-2">Tokens are the virtual currency used to access premium features. Token costs are:</p>
                  <ul className="list-disc pl-6 text-foreground space-y-1">
                    <li>AI Image Generation: 10 tokens per generation</li>
                    <li>Font Generation: 5 tokens per font</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">4.2 Free Tier</p>
                  <p className="text-foreground">New users receive 50 tokens upon signup and 20 tokens monthly.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">4.3 Subscriptions</p>
                  <p className="text-foreground">Paid subscription plans are billed monthly and automatically renew unless cancelled.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">4.4 Refunds</p>
                  <p className="text-foreground">Tokens and subscriptions are non-refundable except as required by law.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Intellectual Property</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-foreground mb-2">5.1 Your Content</p>
                  <p className="text-foreground">You retain all rights to fonts you create. By making fonts public, you grant HappyFont a worldwide, non-exclusive license to display and distribute your fonts within the Service.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">5.2 Our Content</p>
                  <p className="text-foreground">The Service, including its design and technology, is owned by HappyFont and protected by intellectual property laws.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">5.3 Commercial Use</p>
                  <p className="text-foreground">Commercial use of fonts created with HappyFont requires a PRO or BUSINESS subscription.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. User Conduct</h2>
              <p className="text-foreground mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>Upload or create content that is illegal, harmful, or violates others' rights</li>
                <li>Use the Service for any unauthorized commercial purpose</li>
                <li>Attempt to gain unauthorized access to the Service or other accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Disclaimer of Warranties</h2>
              <p className="text-foreground">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Limitation of Liability</h2>
              <p className="text-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, HAPPYFONT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Contact Information</h2>
              <p className="text-foreground">
                If you have any questions about these Terms, please contact us at: legal@happyfont.com
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

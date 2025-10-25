import AnimatedFontCards from '@/components/hero/AnimatedFontCards';
import HowItWorks from '@/components/sections/HowItWorks';
import FontShowcase from '@/components/sections/FontShowcase';
import UseCases from '@/components/sections/UseCases';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background w-full">
      <section className="relative flex w-full flex-col justify-center pt-32 pb-24">
        <div className="w-full px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-16">
            <AnimatedFontCards />

            <div className="text-center max-w-4xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                Create Your Own
                <br />
                Custom Font
              </h1>

              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                Transform your handwriting or ideas into professional fonts in minutes.
                No design experience needed.
              </p>

              <Button
                asChild
                size="lg"
                className="mb-20"
              >
                <Link href="/create" className="flex items-center gap-2">
                  Start Creating Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div className="p-6 rounded-lg bg-card border border-border">
                  <h3 className="text-sm font-semibold mb-1.5">Professional Quality</h3>
                  <p className="text-sm text-muted-foreground">
                    Create fonts that look professionally crafted
                  </p>
                </div>
                <div className="p-6 rounded-lg bg-card border border-border">
                  <h3 className="text-sm font-semibold mb-1.5">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate complete fonts in minutes, not hours
                  </p>
                </div>
                <div className="p-6 rounded-lg bg-card border border-border">
                  <h3 className="text-sm font-semibold mb-1.5">Unlimited Styles</h3>
                  <p className="text-sm text-muted-foreground">
                    From elegant scripts to bold displays
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Font Showcase Section */}
      <FontShowcase />

      {/* Use Cases Section */}
      <UseCases />
    </div>
  );
}

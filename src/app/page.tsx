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
      <section className="relative flex w-full flex-col justify-center bg-gradient-to-b from-background to-muted/30 pt-40 pb-32">
        <div className="w-full px-6 sm:px-8 lg:px-12 max-w-[1800px] mx-auto">
          <div className="flex flex-col items-center gap-16">
            <AnimatedFontCards />

            <div className="text-center max-w-5xl">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.05] tracking-tight">
                Create Your Own
                <br />
                Custom Font
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                Transform your handwriting or ideas into professional fonts in minutes.
                No design experience needed.
              </p>

              <Button
                asChild
                size="lg"
                className="mb-24"
              >
                <Link href="/create" className="flex items-center gap-2">
                  Start Creating Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div className="p-8 rounded-2xl bg-card border border-border hover-lift">
                  <h3 className="text-base font-semibold mb-2">Professional Quality</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create fonts that look professionally crafted
                  </p>
                </div>
                <div className="p-8 rounded-2xl bg-card border border-border hover-lift">
                  <h3 className="text-base font-semibold mb-2">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Generate complete fonts in minutes, not hours
                  </p>
                </div>
                <div className="p-8 rounded-2xl bg-card border border-border hover-lift">
                  <h3 className="text-base font-semibold mb-2">Unlimited Styles</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
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

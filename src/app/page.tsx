import AnimatedFontCards from '@/components/hero/AnimatedFontCards';
import HowItWorks from '@/components/sections/HowItWorks';
import FontShowcase from '@/components/sections/FontShowcase';
import UseCases from '@/components/sections/UseCases';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <section className="relative flex w-full flex-col justify-center bg-background pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col items-center gap-12">
            <AnimatedFontCards />

            <div className="text-center max-w-4xl">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
                Create Your Own Custom Font
                <br />
                with AI Technology
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground mb-10">
                Transform your handwriting or ideas into professional fonts in minutes.
                No design experience needed.
              </p>

              <Button
                asChild
                size="lg"
                className="rounded-full px-8 py-6 text-base mb-20"
              >
                <Link href="/create" className="flex items-center gap-2">
                  Start Creating Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-3">Professional Quality</h3>
                  <p className="text-sm text-muted-foreground">Create fonts that look professionally crafted</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">Generate complete fonts in minutes, not hours</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-3">Unlimited Styles</h3>
                  <p className="text-sm text-muted-foreground">From elegant scripts to bold displays</p>
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

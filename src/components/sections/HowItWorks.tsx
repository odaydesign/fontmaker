'use client';

import React from 'react';
import { Upload, Sparkles, Download, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Upload Your Design',
    description: 'Upload images of your hand-drawn characters or use our AI to generate them from prompts.',
    icon: <Upload className="w-8 h-8" />
  },
  {
    number: 2,
    title: 'AI Processing',
    description: 'Our advanced AI analyzes your designs and converts them into professional font characters.',
    icon: <Sparkles className="w-8 h-8" />
  },
  {
    number: 3,
    title: 'Preview & Adjust',
    description: 'Review your custom font, make adjustments, and ensure every character looks perfect.',
    icon: <CheckCircle className="w-8 h-8" />
  },
  {
    number: 4,
    title: 'Download & Use',
    description: 'Download your font in standard formats (.ttf, .otf) and use it anywhere you want.',
    icon: <Download className="w-8 h-8" />
  }
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create your custom font in four simple steps. No design experience needed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
          {STEPS.map((step, index) => (
            <div key={step.number} className="relative">
              {index < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-border -z-10" />
              )}

              <Card className="h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {step.number}
                  </div>

                  <div className="text-primary flex justify-center mb-4">
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-bold mb-3">
                    {step.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6 text-lg">
            Ready to get started? It takes less than 5 minutes.
          </p>
          <Button size="lg" className="rounded-full px-8">
            Create Your Font Now
          </Button>
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import { Palette, BookOpen, Package, Heart, Briefcase, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
}

const USE_CASES: UseCase[] = [
  {
    id: 'branding',
    title: 'Brand Identity',
    description: 'Create a unique, memorable font that perfectly represents your brand\'s personality.',
    icon: <Briefcase className="w-6 h-6" />,
    examples: ['Logo design', 'Business cards', 'Marketing materials']
  },
  {
    id: 'weddings',
    title: 'Weddings & Events',
    description: 'Design personalized fonts for invitations, signage, and special occasion materials.',
    icon: <Heart className="w-6 h-6" />,
    examples: ['Save the dates', 'Table cards', 'Thank you notes']
  },
  {
    id: 'publishing',
    title: 'Books & Publishing',
    description: 'Craft distinctive typefaces for book covers, chapter headings, and special editions.',
    icon: <BookOpen className="w-6 h-6" />,
    examples: ['Book titles', 'Chapter headers', 'Author signatures']
  },
  {
    id: 'packaging',
    title: 'Product Packaging',
    description: 'Stand out on shelves with custom fonts designed specifically for your product line.',
    icon: <Package className="w-6 h-6" />,
    examples: ['Product labels', 'Box designs', 'Brand messaging']
  },
  {
    id: 'art',
    title: 'Art & Creative',
    description: 'Express your artistic vision through custom typography for prints, posters, and more.',
    icon: <Palette className="w-6 h-6" />,
    examples: ['Art prints', 'Posters', 'Digital artwork']
  },
  {
    id: 'social',
    title: 'Social Media',
    description: 'Create eye-catching, on-brand fonts for your social media content and campaigns.',
    icon: <Sparkles className="w-6 h-6" />,
    examples: ['Instagram posts', 'YouTube thumbnails', 'Brand hashtags']
  }
];

export default function UseCases() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Perfect For Any Project
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From personal projects to professional branding, custom fonts add that special touch
            that sets your work apart.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {USE_CASES.map((useCase) => (
            <Card
              key={useCase.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary/10 transition-colors">
                  {useCase.icon}
                </div>

                <h3 className="text-2xl font-bold mb-3">
                  {useCase.title}
                </h3>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {useCase.description}
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">
                    Popular uses:
                  </p>
                  <ul className="space-y-1">
                    {useCase.examples.map((example, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="text-center mt-16 bg-primary text-primary-foreground border-0">
          <CardContent className="p-12">
            <h3 className="text-3xl font-bold mb-4">
              Whatever your vision, we'll help you create it
            </h3>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of creators, designers, and businesses who trust us to bring their
              custom font ideas to life.
            </p>
            <Button size="lg" variant="secondary" className="rounded-full px-8">
              Start Your Free Project
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

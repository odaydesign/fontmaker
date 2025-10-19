'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ShowcaseFont {
  id: string;
  name: string;
  style: string;
  description: string;
  sampleText: string;
}

const SHOWCASE_EXAMPLES: ShowcaseFont[] = [
  {
    id: '1',
    name: 'Handwritten Script',
    style: 'Elegant & Personal',
    description: 'Perfect for invitations and greeting cards',
    sampleText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: '2',
    name: 'Bold Display',
    style: 'Modern & Powerful',
    description: 'Great for headlines and branding',
    sampleText: 'MAKE YOUR MARK'
  },
  {
    id: '3',
    name: 'Playful Brush',
    style: 'Creative & Fun',
    description: 'Ideal for children\'s books and casual designs',
    sampleText: 'Have Fun Creating!'
  },
  {
    id: '4',
    name: 'Minimalist Sans',
    style: 'Clean & Professional',
    description: 'Perfect for corporate and tech brands',
    sampleText: 'Simplicity is key'
  },
  {
    id: '5',
    name: 'Vintage Serif',
    style: 'Classic & Timeless',
    description: 'Excellent for traditional and premium brands',
    sampleText: 'Timeless Elegance'
  },
  {
    id: '6',
    name: 'Decorative Art',
    style: 'Artistic & Unique',
    description: 'Stand out with custom decorative elements',
    sampleText: 'Express Yourself'
  }
];

export default function FontShowcase() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Styles' },
    { id: 'handwritten', label: 'Handwritten' },
    { id: 'display', label: 'Display' },
    { id: 'decorative', label: 'Decorative' }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Font Showcase
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore fonts created by our AI. From elegant scripts to bold displays,
            see what's possible with your custom designs.
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-12 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className="rounded-full"
            >
              {category.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SHOWCASE_EXAMPLES.map((font) => (
            <Card key={font.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-64 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">
                    {font.sampleText}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Preview sample
                  </p>
                </div>
              </div>

              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-1">
                  {font.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {font.style}
                </p>
                <p className="text-sm">
                  {font.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Ready to create your own custom font?
          </p>
          <Button size="lg" className="rounded-full px-8">
            Start Creating Now
          </Button>
        </div>
      </div>
    </section>
  );
}

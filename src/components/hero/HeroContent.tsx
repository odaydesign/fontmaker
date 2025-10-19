'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeroContent() {
  return (
    <div className="flex flex-col items-center text-center px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Main Headline */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
        Create Stunning AI Generated
        <br />
        Photos Instantly
      </h1>

      {/* Subheadline */}
      <p className="text-base sm:text-lg text-gray-500 mb-10 max-w-2xl">
        Transform your ideas into breathtaking visuals with cutting-edge AI technology.
      </p>

      {/* CTA Button */}
      <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8 py-6 mb-16">
        <Link href="/create" className="flex items-center gap-2">
          Start Generating Now
          <ArrowRight className="w-5 h-5" />
        </Link>
      </Button>

      {/* Three Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full text-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Realistic Results</h3>
          <p className="text-sm text-gray-500">Realistic Results* Photos that look professionally crafted</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Fast Generation</h3>
          <p className="text-sm text-gray-500">Turn ideas into images in seconds</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Diverse Styles</h3>
          <p className="text-sm text-gray-500">Choose from a wide range of artistic options</p>
        </div>
      </div>
    </div>
  );
}

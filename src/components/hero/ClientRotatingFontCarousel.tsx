'use client';

import dynamic from 'next/dynamic';

// Disable SSR for RotatingFontCarousel to prevent hydration mismatches
const RotatingFontCarousel = dynamic(
  () => import('./RotatingFontCarousel'),
  { ssr: false }
);

export default function ClientRotatingFontCarousel() {
  return <RotatingFontCarousel />;
}

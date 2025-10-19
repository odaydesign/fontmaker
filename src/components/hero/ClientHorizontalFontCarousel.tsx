'use client';

import dynamic from 'next/dynamic';

// Disable SSR for HorizontalFontCarousel to prevent hydration mismatches
const HorizontalFontCarousel = dynamic(
  () => import('./HorizontalFontCarousel'),
  { ssr: false }
);

export default function ClientHorizontalFontCarousel() {
  return <HorizontalFontCarousel />;
}

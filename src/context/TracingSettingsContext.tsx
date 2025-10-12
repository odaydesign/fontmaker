'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TracingSettings } from '@/components/tools/TracingQualityPreview';

interface TracingSettingsContextType {
  settings: TracingSettings;
  setSettings: (settings: TracingSettings) => void;
}

const TracingSettingsContext = createContext<TracingSettingsContextType | undefined>(
  undefined
);

export function TracingSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TracingSettings>({
    usePotrace: true,        // Use potrace by default
    upscaleAmount: 2,        // 2x upscale
    ltres: 0.01,
    qtres: 0.01,
    blurRadius: 0,
    smoothing: 2,            // Pre-smoothing: 2
    turdsize: 9,             // Speckle suppression: 9
    alphamax: 1.2,           // Corner threshold: 1.2
    opttolerance: 0.55,      // Curve optimization: 0.55
  });

  return (
    <TracingSettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </TracingSettingsContext.Provider>
  );
}

export function useTracingSettings() {
  const context = useContext(TracingSettingsContext);
  if (context === undefined) {
    throw new Error('useTracingSettings must be used within TracingSettingsProvider');
  }
  return context;
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface OnboardingBackgroundProps {
  currentStep: number;
  steps: {
    id: number;
    backgroundImage: string;
    backgroundOverlay?: string;
    gradientFrom: string;
    gradientTo: string;
    gradientStops: { start: string; end: string };
    gradientOpacity: number;
  }[];
}

export function OnboardingBackground({ currentStep, steps }: OnboardingBackgroundProps) {
  const step = steps[currentStep];

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 h-full w-full"
        >
          {/* Main Image */}
          <Image
            src={step.backgroundImage}
            alt={`Background for step ${step.id}`}
            fill
            className="object-cover"
            priority
            quality={90}
          />

          {/* Solid Color Overlay */}
          {step.backgroundOverlay && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: step.backgroundOverlay }}
            />
          )}

          {/* Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${step.gradientFrom} ${step.gradientStops.start}, ${step.gradientTo} ${step.gradientStops.end})`,
              opacity: step.gradientOpacity,
            }}
          />
          
          {/* Extra Cinematic Darkening for Text Contrast */}
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

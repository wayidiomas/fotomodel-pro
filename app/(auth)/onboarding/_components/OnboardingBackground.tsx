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
      backgroundPosition?: string;
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
            style={{ objectPosition: step.backgroundPosition ?? 'center center' }}
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

          {/* Global scrim for consistent contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/22 to-black/52 mix-blend-multiply" />

          {/* Subtle light spills to keep depth without killing texture */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background:radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.09),transparent_32%),radial-gradient(circle_at_60%_75%,rgba(255,255,255,0.08),transparent_36%)]" />

          {/* Final dark veil to guarantee readability */}
          <div className="absolute inset-0 bg-black/18" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

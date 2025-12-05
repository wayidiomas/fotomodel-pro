'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingBackground } from './_components/OnboardingBackground';
import { OnboardingContent } from './_components/OnboardingContent';

/**
 * Onboarding Flow Page
 *
 * Design: Immersive Cinematic Experience
 * - Fullscreen animated backgrounds
 * - Glassmorphic central card
 * - Smooth transitions with Framer Motion
 */

type OnboardingStep = {
  id: number;
  title: string;
  subtitle: string;
  info?: string;
  backgroundImage: string;
  backgroundOverlay?: string;
  gradientFrom: string;
  gradientTo: string;
  gradientStops: { start: string; end: string };
  gradientOpacity: number;
  backgroundPosition?: string;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Fotografe ou envie a peça de roupa que deseja divulgar',
    subtitle: 'Escolha entre parte de cima, parte de baixo ou look completo.',
    backgroundImage: '/assets/images/Onboarding/onboarding_foto_1.png',
    backgroundOverlay: 'rgba(7, 9, 20, 0.25)',
    gradientFrom: 'rgba(7, 9, 20, 0.6)',
    gradientTo: 'rgba(7, 9, 20, 0.12)',
    gradientStops: { start: '18%', end: '88%' },
    gradientOpacity: 0.75,
    backgroundPosition: 'center 12%',
  },
  {
    id: 2,
    title: 'Escolha quem vai vestir sua peça',
    subtitle: 'Modelos de todos os estilos, gêneros, tons de pele e idades à sua disposição.',
    backgroundImage: '/assets/images/Onboarding/onboarding_foto_2.png',
    backgroundOverlay: 'rgba(9, 11, 24, 0.22)',
    gradientFrom: 'rgba(9, 11, 24, 0.5)',
    gradientTo: 'rgba(15, 23, 42, 0.12)',
    gradientStops: { start: '18%', end: '88%' },
    gradientOpacity: 0.7,
    backgroundPosition: 'center 16%',
  },
  {
    id: 3,
    title: 'Pronto!',
    subtitle: 'Baixe suas imagens finalizadas e comece a divulgar agora.',
    info: 'Cada download consome 1 crédito.',
    backgroundImage: '/assets/images/Onboarding/onboarding_foto_3.png',
    backgroundOverlay: 'rgba(12, 7, 16, 0.22)',
    gradientFrom: 'rgba(14, 9, 20, 0.52)',
    gradientTo: 'rgba(26, 19, 32, 0.14)',
    gradientStops: { start: '16%', end: '86%' },
    gradientOpacity: 0.72,
    backgroundPosition: 'center 18%',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      router.push('/onboarding/loading');
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/loading');
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background Layer */}
      <OnboardingBackground currentStep={currentStep} steps={ONBOARDING_STEPS} />

      {/* Content Layer */}
      <OnboardingContent
        currentStep={currentStep}
        totalSteps={ONBOARDING_STEPS.length}
        stepData={step}
        onNext={handleNext}
        onSkip={handleSkip}
        isLastStep={isLastStep}
      />
    </main>
  );
}

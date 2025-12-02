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
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Fotografe ou envie a peça de roupa que deseja divulgar',
    subtitle: 'Escolha entre parte de cima, parte de baixo ou look completo.',
    backgroundImage: '/assets/images/Onboarding/step-1.png',
    backgroundOverlay: '#504945',
    gradientFrom: 'rgba(255, 255, 255, 0)',
    gradientTo: '#9E9E9E',
    gradientStops: { start: '7.242%', end: '61.522%' },
    gradientOpacity: 0.35,
  },
  {
    id: 2,
    title: 'Escolha quem vai vestir sua peça',
    subtitle: 'Modelos de todos os estilos, gêneros, tons de pele e idades à sua disposição.',
    backgroundImage: '/assets/images/Onboarding/step-2.png',
    gradientFrom: 'rgba(255, 255, 255, 0)',
    gradientTo: '#FFF2F2',
    gradientStops: { start: '7.242%', end: '42.136%' },
    gradientOpacity: 0.49,
  },
  {
    id: 3,
    title: 'Pronto!',
    subtitle: 'Baixe suas imagens finalizadas e comece a divulgar agora.',
    info: 'Cada download consome 1 crédito.',
    backgroundImage: '/assets/images/Onboarding/step-3.png',
    gradientFrom: 'rgba(255, 255, 255, 0)',
    gradientTo: '#9E9E9E',
    gradientStops: { start: '7.242%', end: '61.522%' },
    gradientOpacity: 0.35,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      router.push('/dashboard');
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
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

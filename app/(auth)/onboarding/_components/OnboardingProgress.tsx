'use client';

import { motion } from 'framer-motion';

interface OnboardingProgressProps {
    currentStep: number;
    totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
    return (
        <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                    <div
                        key={index}
                        className="relative h-2 w-14 overflow-hidden rounded-full bg-black/10"
                    >
                        <motion.div
                            initial={false}
                            animate={{
                                width: isActive ? '100%' : isCompleted ? '100%' : '0%',
                                backgroundColor: isActive || isCompleted ? '#111827' : 'transparent',
                            }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                            className="absolute inset-y-0 left-0 h-full rounded-full shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
                            style={{
                                backgroundImage:
                                    isActive || isCompleted
                                        ? 'linear-gradient(90deg, #111827 0%, #0F172A 55%, #0B1224 100%)'
                                        : undefined,
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
}

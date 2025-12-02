'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { ArrowRight, Forward } from '@/components/icons';
import { OnboardingProgress } from './OnboardingProgress';

interface OnboardingContentProps {
    currentStep: number;
    totalSteps: number;
    stepData: {
        id: number;
        title: string;
        subtitle: string;
        info?: string;
    };
    onNext: () => void;
    onSkip: () => void;
    isLastStep: boolean;
}

export function OnboardingContent({
    currentStep,
    totalSteps,
    stepData,
    onNext,
    onSkip,
    isLastStep,
}: OnboardingContentProps) {
    return (
        <div className="relative z-10 flex h-full w-full items-center justify-center p-6">
            <motion.div
                layout
                className="w-full max-w-[520px] overflow-hidden rounded-[32px] border border-white/20 bg-white/80 p-10 shadow-2xl backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="flex flex-col gap-8">
                    {/* Header & Progress */}
                    <div className="flex flex-col items-center gap-6">
                        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
                    </div>

                    {/* Text Content */}
                    <div className="flex flex-col gap-4 text-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={stepData.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col gap-4"
                            >
                                <h2 className="font-haas text-[32px] font-medium leading-tight tracking-tight text-black md:text-[36px]">
                                    {stepData.title}
                                </h2>
                                <p className="font-inter text-[18px] leading-relaxed text-black/70">
                                    {stepData.subtitle}
                                </p>
                                {stepData.info && (
                                    <p className="font-inter text-[14px] font-medium text-black/50">
                                        {stepData.info}
                                    </p>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        {!isLastStep ? (
                            <>
                                <Button
                                    variant="outline"
                                    className="h-[52px] flex-1 justify-center rounded-xl border-black/10 bg-transparent text-[16px] font-medium hover:bg-black/5"
                                    onClick={onSkip}
                                >
                                    Pular
                                </Button>
                                <Button
                                    variant="primary"
                                    className="h-[52px] flex-1 justify-center gap-2 rounded-xl bg-black text-[16px] font-medium text-white hover:bg-black/90"
                                    onClick={onNext}
                                >
                                    Próximo
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="primary"
                                className="h-[52px] w-full justify-center rounded-xl bg-black text-[16px] font-medium text-white hover:bg-black/90"
                                onClick={onNext}
                            >
                                Começar Agora
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

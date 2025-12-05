'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { ArrowRight } from '@/components/icons';
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
            <div className="relative w-full max-w-[560px] translate-y-6 sm:translate-y-8 md:translate-y-10">
                <div className="absolute inset-0 -z-10 rounded-[32px] bg-white/10 blur-3xl" />
                <motion.div
                    layout
                    className="w-full overflow-hidden rounded-[28px] border border-white/20 bg-white/90 px-8 py-9 shadow-[0_30px_110px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-10 sm:py-12"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="flex flex-col gap-9">
                        {/* Header & Progress */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.14em] text-black/60">
                                <span>Passo {currentStep + 1} de {totalSteps}</span>
                                <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold text-black/70">Tour rápido</span>
                            </div>
                            <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col gap-4 text-center sm:text-left">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={stepData.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex flex-col gap-4"
                                >
                                    <h2 className="font-freight text-[34px] font-medium leading-tight tracking-tight text-black sm:text-[38px]">
                                        {stepData.title}
                                    </h2>
                                    <p className="font-inter text-[17px] leading-relaxed text-black/75 sm:text-[18px]">
                                        {stepData.subtitle}
                                    </p>
                                    {stepData.info && (
                                        <p className="font-inter text-[14px] font-medium text-black/60">
                                            {stepData.info}
                                        </p>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                            {!isLastStep ? (
                                <>
                                    <Button
                                        variant="outline"
                                        className="h-[52px] flex-1 justify-center rounded-xl border-black/10 bg-black/5 text-[16px] font-medium text-black/75 transition hover:-translate-y-[1px] hover:border-black/15 hover:bg-black/10"
                                        onClick={onSkip}
                                    >
                                        Pular
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="h-[52px] flex-1 justify-center gap-2 rounded-xl bg-black text-[16px] font-semibold text-white transition hover:-translate-y-[1px] hover:bg-black/90"
                                        onClick={onNext}
                                    >
                                        Próximo
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="primary"
                                    className="h-[52px] w-full justify-center rounded-xl bg-black text-[16px] font-semibold text-white transition hover:-translate-y-[1px] hover:bg-black/90"
                                    onClick={onNext}
                                >
                                    Começar Agora
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

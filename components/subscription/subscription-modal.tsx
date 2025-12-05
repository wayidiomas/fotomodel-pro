'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Star, Zap, Crown, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSubscriptionPlans, useUserSubscription } from '@/lib/hooks/use-queries';
import { useState } from 'react';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Icon mapping by plan slug
const PLAN_ICONS: Record<string, React.ElementType> = {
    free: Star,
    starter: Zap,
    pro: Crown,
    enterprise: Shield,
};

// Gradient mapping by plan slug
const PLAN_GRADIENTS: Record<string, string> = {
    free: 'from-gray-100 to-gray-200',
    starter: 'from-blue-50 to-indigo-50',
    pro: 'from-amber-50 to-orange-50',
    enterprise: 'from-slate-100 to-slate-200',
};

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
    const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
    const { data: userSubscription, isLoading: subscriptionLoading } = useUserSubscription();
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

    const currentPlanSlug = userSubscription?.subscription_plans?.slug || 'free';

    const handleSubscribe = async (planId: string, planSlug: string) => {
        // Free plan doesn't need checkout
        if (planSlug === 'free') {
            return;
        }

        setLoadingPlanId(planId);

        try {
            // Se já tem assinatura ativa, usar portal para upgrade/downgrade
            const hasActiveSubscription = userSubscription?.subscription_status === 'active';

            if (hasActiveSubscription) {
                // Abrir Stripe Customer Portal para gerenciar/trocar plano
                const portalResponse = await fetch('/api/stripe/create-portal-session', {
                    method: 'POST',
                });

                if (!portalResponse.ok) {
                    const error = await portalResponse.json();
                    throw new Error(error.error || 'Failed to open portal');
                }

                const data = await portalResponse.json();
                console.log('Portal response:', data);

                if (!data.url) {
                    throw new Error('Portal URL not found in response');
                }

                window.location.href = data.url;
            } else {
                // Nova assinatura - criar checkout
                const response = await fetch('/api/stripe/create-checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ planId }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to create checkout');
                }

                const { checkoutUrl } = await response.json();

                // Redirect to Stripe Checkout
                window.location.href = checkoutUrl;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao processar solicitação. Tente novamente.');
            setLoadingPlanId(null);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    const getButtonText = (planSlug: string, isCurrentPlan: boolean, planPriceBrl: number) => {
        if (isCurrentPlan) {
            return 'Plano Atual';
        }

        if (planSlug === 'free') {
            return 'Plano Gratuito';
        }

        const hasActiveSubscription = userSubscription?.subscription_status === 'active';
        const currentPlan = userSubscription?.subscription_plans;

        if (hasActiveSubscription && currentPlan) {
            // Comparar preços para determinar se é upgrade ou downgrade
            const currentPrice = parseFloat(currentPlan.price_brl);
            const newPrice = planPriceBrl;

            if (newPrice > currentPrice) {
                return 'Fazer Upgrade';
            } else if (newPrice < currentPrice) {
                return 'Fazer Downgrade';
            }
        }

        return `Assinar ${planSlug.charAt(0).toUpperCase() + planSlug.slice(1)}`;
    };

    const isLoading = plansLoading || subscriptionLoading;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                            className="relative w-full max-w-6xl rounded-[32px] bg-[#fdfcf8] shadow-2xl ring-1 ring-black/5"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute right-6 top-6 z-10 rounded-full bg-black/5 p-2 transition-colors hover:bg-black/10"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>

                            <div className="p-6 md:p-8">
                                {/* Header */}
                                <div className="mb-8 text-center">
                                    <h2 className="font-freight text-3xl font-medium text-gray-900 md:text-4xl">
                                        Escolha o plano ideal
                                    </h2>
                                    <p className="mt-2 font-inter text-base text-gray-600">
                                        Desbloqueie todo o potencial da sua criatividade com nossos planos flexíveis
                                    </p>
                                </div>

                                {/* Loading State */}
                                {isLoading && (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                    </div>
                                )}

                                {/* Plans Grid */}
                                {!isLoading && plans && (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        {plans.map((plan: any) => {
                                            const Icon = PLAN_ICONS[plan.slug] || Star;
                                            const isCurrentPlan = plan.slug === currentPlanSlug;
                                            const isPopular = plan.slug === 'pro';
                                            const isPlanLoading = loadingPlanId === plan.id;

                                            // Build concise feature list - only essential items
                                            const displayFeatures = [
                                                {
                                                    text: plan.is_one_time_credits
                                                        ? `${plan.monthly_credits} créditos (única vez)`
                                                        : `${plan.monthly_credits} créditos mensais`,
                                                    included: true,
                                                },
                                                {
                                                    text: plan.max_wardrobe_items === -1
                                                        ? 'Peças ilimitadas'
                                                        : `Até ${plan.max_wardrobe_items} peças no vestuário`,
                                                    included: true,
                                                },
                                                {
                                                    text: plan.max_downloads === -1
                                                        ? 'Downloads ilimitados'
                                                        : 'Downloads limitados',
                                                    included: true,
                                                },
                                                ...(plan.extra_credit_price_brl > 0
                                                    ? [{
                                                        text: `${formatPrice(plan.extra_credit_price_brl)} por crédito extra`,
                                                        included: true
                                                    }]
                                                    : []),
                                                ...(plan.has_priority_support
                                                    ? [{
                                                        text: 'Suporte prioritário (WhatsApp)',
                                                        included: true
                                                    }]
                                                    : []),
                                            ];

                                            return (
                                                <div
                                                    key={plan.id}
                                                    className={cn(
                                                        'relative flex flex-col rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                                                        isCurrentPlan
                                                            ? 'border-[#64748b] bg-gradient-to-b from-[#f8fafc] to-white shadow-lg ring-2 ring-[#64748b]'
                                                            : isPopular
                                                            ? 'border-[#e7dcc2] bg-gradient-to-b from-[#fdfbf7] to-white shadow-lg ring-1 ring-[#e7dcc2]'
                                                            : 'border-gray-200 bg-white shadow-sm hover:border-gray-300'
                                                    )}
                                                >
                                                    {isCurrentPlan && (
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#475569] to-[#64748b] px-3 py-1 text-xs font-bold text-white shadow-sm">
                                                            PLANO ATUAL
                                                        </div>
                                                    )}
                                                    {!isCurrentPlan && isPopular && (
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#dbcba1] via-[#c6a972] to-[#b08c4a] px-3 py-1 text-xs font-bold text-white shadow-sm">
                                                            MAIS POPULAR
                                                        </div>
                                                    )}

                                                    {/* Plan Header */}
                                                    <div className="mb-4">
                                                        <div className={cn(
                                                            "mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
                                                            PLAN_GRADIENTS[plan.slug] || 'from-gray-100 to-gray-200'
                                                        )}>
                                                            <Icon className="h-5 w-5 text-gray-700" />
                                                        </div>
                                                        <h3 className="font-freight text-xl font-medium text-gray-900">
                                                            {plan.name_pt}
                                                        </h3>
                                                        <p className="mt-1 font-inter text-xs text-gray-500">
                                                            {plan.description_pt}
                                                        </p>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="mb-4">
                                                        <div className="flex items-baseline">
                                                            <span className="font-inter text-2xl font-bold text-gray-900">
                                                                {formatPrice(plan.price_brl)}
                                                            </span>
                                                            {plan.billing_interval !== 'one_time' && (
                                                                <span className="font-inter text-xs text-gray-500">
                                                                    /{plan.billing_interval === 'month' ? 'mês' : 'ano'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {plan.extra_credit_price_brl > 0 && (
                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                <p className="font-inter text-[10px] text-gray-500">
                                                                    {formatPrice(plan.extra_credit_price_brl)} por crédito adicional
                                                                </p>
                                                                <div className="group relative">
                                                                    <div className="cursor-help rounded-full border border-gray-300 p-0.5 text-gray-400 hover:border-gray-400 hover:text-gray-500">
                                                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <circle cx="12" cy="12" r="10" />
                                                                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                                            <path d="M12 17h.01" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-center text-[10px] leading-tight text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                                                                        Apenas se você habilitar a cobrança de créditos extras
                                                                        <div className="absolute top-full left-1/2 -mt-1 -ml-1 border-4 border-transparent border-t-gray-900" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Features */}
                                                    <ul className="mb-6 flex-1 space-y-2.5">
                                                        {displayFeatures.map((feature, idx) => (
                                                            <li key={idx} className="flex items-start gap-2.5">
                                                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f4f0e7]">
                                                                    <Check className="h-2.5 w-2.5 text-[#b08c4a]" />
                                                                </div>
                                                                <span className="font-inter text-xs text-gray-600">
                                                                    {feature.text}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    {/* Action Button */}
                                                    <Button
                                                        onClick={() => handleSubscribe(plan.id, plan.slug)}
                                                        disabled={isCurrentPlan || isPlanLoading || plan.slug === 'free'}
                                                        className={cn(
                                                            "w-full rounded-xl py-5 font-inter font-semibold transition-all text-sm",
                                                            isPopular && !isCurrentPlan
                                                                ? "bg-gradient-to-r from-[#dbcba1] via-[#c6a972] to-[#b08c4a] text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                                                                : "bg-white text-gray-900 border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50",
                                                            isCurrentPlan && "opacity-60 cursor-not-allowed"
                                                        )}
                                                    >
                                                        {isPlanLoading ? (
                                                            <span className="flex items-center justify-center gap-2">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Processando...
                                                            </span>
                                                        ) : (
                                                            getButtonText(plan.slug, isCurrentPlan, parseFloat(plan.price_brl))
                                                        )}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Footer Info */}
                                <div className="mt-12 text-center">
                                    <p className="font-inter text-sm text-gray-500">
                                        Dúvidas sobre os planos? <a href="#" className="font-medium text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900">Fale com nosso time</a>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

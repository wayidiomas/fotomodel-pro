'use client';

import { useState } from 'react';
import { MainHeader } from '@/components/shared/main-header';
import { Button } from '@/components/ui';
import { User, Mail, Phone, Zap, Image as ImageIcon, Shield, Loader2, Download, Pencil, Check, X } from 'lucide-react';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { SubscriptionModal } from '@/components/subscription/subscription-modal';

interface PerfilClientProps {
  userData: {
    name: string;
    email: string | null;
    phone: string | null;
    provider: 'email' | 'phone';
  };
  planData: {
    name: string;
    status: string;
    renewalDate: string | null;
    price: string;
  };
  stats: {
    credits: number;
    imagesGenerated: number;
    downloads: number;
  };
  hasStripeCustomer: boolean;
  planSlug: string;
}

export function PerfilClient({ userData, planData, stats, hasStripeCustomer, planSlug }: PerfilClientProps) {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(userData.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const isFreeUser = planSlug === 'free';

  const handleSaveName = async () => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      addToast({
        type: 'error',
        title: 'Nome inválido',
        description: 'Por favor, informe um nome válido.',
      });
      return;
    }

    try {
      setIsSavingName(true);
      const response = await fetch('/api/user/update-name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar nome');
      }

      addToast({
        type: 'success',
        title: 'Nome atualizado!',
        description: 'Seu nome foi atualizado com sucesso.',
      });

      setIsEditingName(false);
      // Reload page to update header and other places
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating name:', error);
      addToast({
        type: 'error',
        title: 'Erro ao atualizar',
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setNewName(userData.name);
    setIsEditingName(false);
  };

  const handleManageSubscription = async () => {
    // If free user, open subscription modal
    if (isFreeUser) {
      setIsSubscriptionModalOpen(true);
      return;
    }

    if (!hasStripeCustomer) {
      addToast({
        type: 'error',
        title: 'Assinatura não encontrada',
        description: 'Você ainda não possui uma assinatura ativa.',
      });
      return;
    }

    try {
      setIsLoadingPortal(true);
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao abrir portal de assinatura');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error opening portal:', error);
      addToast({
        type: 'error',
        title: 'Erro ao abrir portal',
        description: error.message || 'Tente novamente mais tarde.',
      });
      setIsLoadingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#fff] to-[#f7f4ef]">
      <MainHeader credits={stats.credits} />

      <main className="container mx-auto max-w-5xl px-4 py-12">
        {/* Page Title */}
        <div className="mb-10 text-center">
          <h1 className="font-freight text-4xl font-medium text-[#20202a] md:text-5xl">
            Meu Perfil
          </h1>
          <p className="mt-3 font-inter text-lg text-gray-500">
            Gerencie suas informações pessoais e assinatura
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Column: Personal Info */}
          <div className="md:col-span-1">
            <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
              <div className="flex flex-col items-center text-center">
                {/* Avatar Placeholder */}
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#e7dcc2] to-[#d4c5a3] shadow-inner">
                  <span className="font-freight text-3xl font-medium text-[#4b3f2f]">
                    {userData.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <h2 className="font-freight text-2xl font-medium text-[#20202a]">
                  {userData.name}
                </h2>
                <p className="font-inter text-sm text-gray-500">
                  {userData.provider === 'email' ? userData.email : userData.phone}
                </p>

                <div className="mt-6 w-full space-y-4">
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                    <User size={18} className="text-gray-400" />
                    <div className="flex-1 text-left">
                      <p className="text-xs text-gray-400">Nome Completo</p>
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 px-2 py-1 font-inter text-sm font-medium text-gray-700 focus:border-[#20202a] focus:outline-none focus:ring-1 focus:ring-[#20202a]"
                            disabled={isSavingName}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <p className="font-inter text-sm font-medium text-gray-700">{userData.name}</p>
                      )}
                    </div>
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveName}
                          disabled={isSavingName}
                          className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-700 disabled:opacity-50"
                          title="Salvar"
                        >
                          {isSavingName ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSavingName}
                          className="rounded-lg bg-gray-400 p-1.5 text-white hover:bg-gray-500 disabled:opacity-50"
                          title="Cancelar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                        title="Editar nome"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {userData.provider === 'email' && userData.email && (
                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                      <Mail size={18} className="text-gray-400" />
                      <div className="text-left">
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="font-inter text-sm font-medium text-gray-700">{userData.email}</p>
                      </div>
                    </div>
                  )}

                  {userData.provider === 'phone' && userData.phone && (
                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                      <Phone size={18} className="text-gray-400" />
                      <div className="text-left">
                        <p className="text-xs text-gray-400">Telefone</p>
                        <p className="font-inter text-sm font-medium text-gray-700">{userData.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Subscription & Stats */}
          <div className="space-y-8 md:col-span-2">
            {/* Subscription Card */}
            <div className="relative overflow-hidden rounded-3xl border border-[#e7dcc2]/60 bg-gradient-to-br from-[#fff] to-[#fcfaf5] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#e7dcc2]/10 blur-3xl" />

              <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Shield size={20} className="text-[#b08c4a]" />
                    <span className="font-inter text-sm font-semibold uppercase tracking-wider text-[#b08c4a]">
                      Plano Atual
                    </span>
                  </div>
                  <h3 className="font-freight text-4xl font-medium text-[#20202a]">
                    {planData.name}
                  </h3>
                  <p className="mt-1 font-inter text-gray-500">
                    {planData.renewalDate ? `Renova em ${planData.renewalDate}` : 'Sem renovação agendada'} • {planData.price}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={handleManageSubscription}
                    disabled={isLoadingPortal}
                    className={isFreeUser
                      ? "bg-gradient-to-r from-[#b8a176] to-[#d4c5a3] text-white hover:from-[#a89066] hover:to-[#c4b593] font-semibold shadow-lg"
                      : "bg-[#20202a] text-white hover:bg-[#20202a]/90"
                    }
                  >
                    {isLoadingPortal ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      isFreeUser ? 'Assine Já' : 'Gerenciar Assinatura'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f0e7] text-[#4b3f2f]">
                  <Zap size={24} />
                </div>
                <p className="font-inter text-sm text-gray-500">Créditos Disponíveis</p>
                <p className="font-freight text-3xl font-medium text-[#20202a]">{stats.credits}</p>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f0e7] text-[#4b3f2f]">
                  <ImageIcon size={24} />
                </div>
                <p className="font-inter text-sm text-gray-500">Imagens Geradas</p>
                <p className="font-freight text-3xl font-medium text-[#20202a]">{stats.imagesGenerated}</p>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f0e7] text-[#4b3f2f]">
                  <Download size={24} />
                </div>
                <p className="font-inter text-sm text-gray-500">Downloads</p>
                <p className="font-freight text-3xl font-medium text-[#20202a]">{stats.downloads}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />
    </div>
  );
}

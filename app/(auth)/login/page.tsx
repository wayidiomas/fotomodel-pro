'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button, VerificationCodeInput } from '@/components/ui';
import { PhoneInput } from 'react-international-phone';
import { createClient } from '@/lib/supabase/client';
import 'react-international-phone/style.css';

type AuthStep = 'login' | 'phone' | 'verify';

type ModelSpotlight = {
  id: string;
  badge: string;
  title: string;
  caption: string;
  alt: string;
  image: string;
  position: Partial<Record<'top' | 'left' | 'right' | 'bottom', number | string>>;
  size: { width: number; height: number };
  rotation: number;
  translate: { x: number; y: number };
  objectPosition: string;
  zIndex: number;
  entry: {
    offset: { x: number; y: number };
    rotation: number;
    scale: number;
    delay: number;
  };
};

const toCSSPosition = (
  position: ModelSpotlight['position'],
): Partial<CSSProperties> => {
  const style: Record<string, string | number> = {};

  Object.entries(position).forEach(([key, value]) => {
    style[key] = typeof value === 'number' ? `${value}px` : value;
  });

  return style as Partial<CSSProperties>;
};

/**
 * LoginStep - Step 1: Botões de autenticação
 */
function LoginStep({
  onWhatsAppClick,
  onAppleClick,
}: {
  onWhatsAppClick: () => void;
  onAppleClick: () => void;
}) {
  return (
    <>
      {/* Mobile Layout (default) */}
      <div className="flex min-h-screen flex-col items-center justify-end px-6 pb-12 pt-20 select-none lg:hidden" style={{ touchAction: 'pan-y' }}>
        {/* Welcome Content */}
        <div className="w-full max-w-[343px] animate-slide-up">
          {/* Frame - gap: 23px (Figma) */}
          <div className="flex flex-col items-center gap-6">
            {/* Welcome Text - gap: 10px (Figma) */}
            <div className="flex w-full flex-col items-center gap-2.5 text-center">
              <h2 className="w-full font-freight text-[44px] leading-[44px] text-black">
                Bem-vindo a Fotomodel
              </h2>
              <p className="w-full font-haas text-[18px] leading-[1.6] tracking-[-0.054px] text-black/80">
                Modelos Virtuais. Resultados Reais
              </p>
            </div>

            {/* Login Buttons - gap: 12px (Figma) */}
            <div className="flex w-full flex-col gap-3">
              {/* WhatsApp Button - 322px x 52px, 14px radius (Figma) */}
              <button
                className="group flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[rgba(229,222,214,0.5)] px-2.5 py-2.5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-[rgba(229,222,214,0.8)] hover:shadow-lg active:scale-[0.98]"
                onClick={onWhatsAppClick}
              >
                <Image
                  src="/assets/icons/whatsapp.svg"
                  alt="WhatsApp"
                  width={22}
                  height={22}
                  className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                />
                <span className="font-haas text-[16px] font-medium leading-normal text-black">
                  Entrar com WhatsApp
                </span>
              </button>

              {/* Apple ID Button - 322px x 52px, 14px radius (Figma) */}
              <button
                className="group flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#2c2c2c] px-2.5 py-2.5 transition-all duration-300 hover:scale-[1.02] hover:bg-black hover:shadow-xl active:scale-[0.98]"
                onClick={onAppleClick}
              >
                <Image
                  src="/assets/icons/apple.svg"
                  alt="Apple"
                  width={18}
                  height={22}
                  className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                />
                <span className="font-haas text-[16px] font-medium leading-normal text-white">
                  Entrar com Apple ID
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout (lg+) */}
      <div className="hidden lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:px-8">
        <div className="flex w-full max-w-[1400px] items-center justify-between gap-16">
          {/* Left Side: Welcome Text */}
          <div className="flex-[0.7] animate-slide-right">
            <div className="max-w-[450px]">
              <div className="mb-8">
                <Image
                  src="/assets/images/logo.svg"
                  alt="Logotipo Fotomodel"
                  width={300}
                  height={150}
                  className="mb-4 h-[110px] w-[250px] object-contain"
                />
              </div>

              <h2 className="mb-6 font-freight text-6xl leading-[1.1] text-black">
                Bem-vindo a<br />Fotomodel
              </h2>
              <p className="mb-8 font-haas text-2xl leading-relaxed text-black/70">
                Modelos Virtuais. Resultados Reais
              </p>
              <p className="font-haas text-lg leading-relaxed text-black/60">
                Crie modelos virtuais realistas com IA para suas roupas e produtos.
                Economize tempo e dinheiro em produções fotográficas.
              </p>
            </div>
          </div>

          {/* Right Side: Login Card */}
          <div className="flex flex-[1.3] items-center justify-center">
            <div className="relative z-10 flex w-full max-w-[340px] flex-col rounded-2xl bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="mb-5 text-center font-freight text-[28px] leading-tight text-black">
                Faça seu login
              </h3>

              {/* Login Buttons */}
              <div className="flex flex-col gap-3.5">
                {/* WhatsApp Button */}
                <button
                  className="group flex h-[48px] w-full items-center justify-center gap-2.5 rounded-xl bg-[rgba(229,222,214,0.5)] px-6 py-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-[rgba(229,222,214,0.8)] hover:shadow-xl active:scale-[0.98]"
                  onClick={onWhatsAppClick}
                >
                  <Image
                    src="/assets/icons/whatsapp.svg"
                    alt="WhatsApp"
                    width={24}
                    height={24}
                    className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="font-haas text-lg font-medium leading-normal text-black">
                    Entrar com WhatsApp
                  </span>
                </button>

                {/* Apple ID Button */}
                <button
                  className="group flex h-[48px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#2c2c2c] px-6 py-4 transition-all duration-300 hover:scale-[1.02] hover:bg-black hover:shadow-[0_24px_45px_-24px_rgba(0,0,0,0.55)] active:scale-[0.98]"
                  onClick={onAppleClick}
                >
                  <Image
                    src="/assets/icons/apple.svg"
                    alt="Apple"
                    width={20}
                    height={24}
                    className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="font-haas text-lg font-medium leading-normal text-white">
                    Entrar com Apple ID
                  </span>
                </button>
              </div>

              {/* Footer */}
              <p className="mt-6 text-center font-haas text-sm text-black/50">
                Ao fazer login, você concorda com nossos{' '}
                <button className="underline hover:text-black">Termos de Serviço</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * PhoneStep - Step 1.5: Inserir número de telefone
 */
function PhoneStep({
  onSubmit,
  onBack,
}: {
  onSubmit: (phone: string) => void;
  onBack: () => void;
}) {
  const [phone, setPhone] = useState('+55');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setError('');
  };

  const validatePhone = (phoneStr: string): boolean => {
    // Remove all non-numeric characters except +
    const cleaned = phoneStr.replace(/[^\d+]/g, '');
    // Check if it has at least country code + 10 digits
    // For Brazil: +55 + 10 or 11 digits = 13-14 chars total
    const digitCount = cleaned.replace('+', '').length;
    return digitCount >= 10; // Minimum 10 digits (flexible for international)
  };

  const handleSubmit = async () => {
    if (!validatePhone(phone)) {
      setError('Digite um número de telefone válido');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Erro ao enviar código');
        setIsSending(false);
        return;
      }

      // Success - move to verification step
      onSubmit(phone);
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Erro ao enviar código. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="flex min-h-screen flex-col items-center justify-between px-6 pb-8 pt-20 lg:hidden">
        {/* Logo */}
        <div className="flex-shrink-0 animate-fade-in">
          <Image
            src="/assets/images/logo.svg"
            alt="Logotipo Fotomodel"
            width={190}
            height={90}
            priority
            className="h-[70px] w-[150px] object-contain"
          />
        </div>

        {/* Phone Content */}
        <div className="w-full max-w-[343px] animate-slide-up">
          <div className="flex flex-col items-center gap-6">
            {/* Title */}
            <div className="flex w-full flex-col items-center gap-4 text-center">
              <h2 className="w-full font-freight text-[44px] leading-[44px] text-black">
                Qual seu número?
              </h2>

              {/* Subtitle */}
              <p className="w-full font-haas text-[16px] leading-[1.6] tracking-[-0.054px] text-black/70">
                Vamos enviar um código de verificação via WhatsApp
              </p>
            </div>

            {/* Phone Input */}
            <div className="flex w-full flex-col gap-4">
              <div className="flex flex-col gap-2">
                <PhoneInput
                  defaultCountry="br"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  inputClassName="h-[55px] w-full rounded-[14px] border-2 border-black/10 bg-white px-4 font-haas text-[18px] text-black placeholder:text-black/40 focus:border-black focus:outline-none"
                  countrySelectorStyleProps={{
                    buttonClassName: "h-[55px] rounded-l-[14px] border-2 border-r-0 border-black/10 bg-white hover:bg-gray-50",
                    dropdownStyleProps: {
                      className: "font-haas"
                    }
                  }}
                />
                {error && (
                  <p className="font-haas text-sm text-red-500">{error}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isSending}
                  className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-black px-6 py-4 font-haas text-[16px] font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:bg-black/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSending ? 'Enviando...' : 'Enviar código'}
                </button>
                <button
                  onClick={onBack}
                  disabled={isSending}
                  className="flex h-[52px] w-full items-center justify-center rounded-[14px] border-2 border-black/10 bg-transparent px-6 py-4 font-haas text-[16px] font-medium text-black transition-all duration-300 hover:scale-[1.02] hover:border-black/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:px-8">
        <div className="flex w-full max-w-[1000px] items-center justify-between gap-12">
          {/* Left Side: Logo */}
          <div className="flex-1 animate-slide-right">
            <div className="max-w-[450px]">
              <div className="mb-8">
                <Image
                  src="/assets/images/logo.svg"
                  alt="Logotipo Fotomodel"
                  width={300}
                  height={150}
                  className="mb-4 h-[110px] w-[250px] object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Phone Card */}
          <div className="flex flex-1 items-center justify-center">
            <div className="relative z-10 flex w-full max-w-[420px] flex-col rounded-3xl bg-white/95 p-10 shadow-2xl backdrop-blur-xl">
              {/* WhatsApp Icon + Title */}
              <div className="mb-8 flex flex-col items-center gap-6 text-center">
                {/* WhatsApp Icon Circle */}
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366]/10">
                  <Image
                    src="/assets/icons/whatsapp-gradient.svg"
                    alt="WhatsApp"
                    width={36}
                    height={36}
                    className="shrink-0"
                  />
                </div>

                {/* Title */}
                <h3 className="font-freight text-[40px] leading-tight text-black">
                  Qual seu número?
                </h3>

                {/* Subtitle */}
                <p className="font-haas text-[17px] leading-[1.6] text-black/70">
                  Vamos enviar um código de verificação via WhatsApp
                </p>
              </div>

              {/* Phone Input */}
              <div className="mb-6 flex flex-col gap-2">
                <PhoneInput
                  defaultCountry="br"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  inputClassName="h-[60px] w-full rounded-xl border-2 border-black/10 bg-white px-6 font-haas text-[20px] text-black placeholder:text-black/40 focus:border-black focus:outline-none"
                  countrySelectorStyleProps={{
                    buttonClassName: "h-[60px] rounded-l-xl border-2 border-r-0 border-black/10 bg-white hover:bg-gray-50",
                    dropdownStyleProps: {
                      className: "font-haas"
                    }
                  }}
                />
                {error && (
                  <p className="font-haas text-sm text-red-500">{error}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSending}
                  className="flex h-[56px] w-full items-center justify-center rounded-xl bg-black px-6 font-haas text-[18px] font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:bg-black/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSending ? 'Enviando...' : 'Enviar código'}
                </button>
                <button
                  onClick={onBack}
                  disabled={isSending}
                  className="flex h-[56px] w-full items-center justify-center rounded-xl border-2 border-black/10 bg-transparent px-6 font-haas text-[18px] font-medium text-black transition-all duration-300 hover:scale-[1.02] hover:border-black/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * VerifyStep - Step 3: Verificação de código WhatsApp
 */
function VerifyStep({
  phoneNumber,
  onValidate,
  onBack,
}: {
  phoneNumber: string;
  onValidate: (code: string, isNewUser: boolean) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleCodeComplete = async (verificationCode: string) => {
    setCode(verificationCode);
  };

  const handleValidate = async () => {
    if (code.length !== 6) {
      setError('Por favor, digite o código completo de 6 dígitos');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Código inválido');
        setIsVerifying(false);
        return;
      }

      // Set session in Supabase client using tokens from backend
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        console.error('Error establishing session:', sessionError);
        setError('Erro ao criar sessão. Tente novamente.');
        setIsVerifying(false);
        return;
      }

      // Success - call parent handler with isNewUser info
      onValidate(code, data.isNewUser);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Erro ao verificar código. Tente novamente.');
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Erro ao reenviar código');
        setIsResending(false);
        return;
      }

      setSuccessMessage('Novo código enviado via WhatsApp!');
      setCode(''); // Clear current code
    } catch (err) {
      console.error('Error resending OTP:', err);
      setError('Erro ao reenviar código. Tente novamente.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="flex min-h-screen flex-col items-center justify-between px-6 pb-8 pt-20 lg:hidden">
        {/* Logo */}
        <div className="flex-shrink-0 animate-fade-in">
          <Image
            src="/assets/images/logo.svg"
            alt="Logotipo Fotomodel"
            width={190}
            height={90}
            priority
            className="h-[70px] w-[150px] object-contain"
          />
        </div>

        {/* Verification Content */}
        <div className="w-full max-w-[343px] animate-slide-up">
          <div className="flex flex-col items-center gap-6">
            {/* Title */}
            <h1 className="mb-4 text-center font-inter text-[20px] font-normal tracking-[-0.2px] text-black">
              Login com WhatsApp
            </h1>

            {/* Instructions */}
            <p className="mb-2 w-full max-w-[308px] text-center font-manrope text-[14px] leading-[1.65] tracking-[0.2px] text-greyscale-500">
              Digite o código de verificação de seis dígitos enviado para o número{' '}
              <strong>{phoneNumber}</strong>
            </p>

            {/* 6-Digit Code Input */}
            <div className="mb-4">
              <VerificationCodeInput
                length={6}
                separatorPosition={3}
                onComplete={handleCodeComplete}
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="mb-2 text-center font-inter text-sm text-red-500">{error}</p>
            )}

            {/* Success Message */}
            {successMessage && (
              <p className="mb-2 text-center font-inter text-sm text-green-600">{successMessage}</p>
            )}

            {/* Buttons */}
            <div className="flex w-full flex-col gap-3">
              <Button
                variant="primary"
                size="default"
                onClick={handleValidate}
                disabled={isVerifying || code.length !== 6}
                className="w-full"
              >
                {isVerifying ? 'Validando...' : 'Validar'}
              </Button>

              <Button
                variant="secondary"
                size="default"
                onClick={onBack}
                disabled={isVerifying}
                className="w-full"
              >
                Voltar
              </Button>
            </div>

            {/* Resend Code Link */}
            <div className="mt-2 text-center">
              <button
                className="font-inter text-sm text-greyscale-600 underline hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleResendCode}
                disabled={isResending || isVerifying}
              >
                {isResending ? 'Reenviando...' : 'Não recebeu o código? Reenviar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:px-8">
        <div className="flex w-full max-w-[1000px] items-center justify-between gap-12">
          {/* Left Side: Logo (matches login) */}
          <div className="flex-1 animate-slide-right">
            <div className="max-w-[450px]">
              <div className="mb-8">
                <Image
                  src="/assets/images/logo.svg"
                  alt="Logotipo Fotomodel"
                  width={300}
                  height={150}
                  className="mb-4 h-[110px] w-[250px] object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Verification Card */}
          <div className="flex flex-1 items-center justify-center">
            <div className="relative z-10 flex w-full max-w-[420px] flex-col rounded-3xl bg-white/95 p-10 shadow-2xl backdrop-blur-xl">
              {/* WhatsApp Icon + Title */}
              <div className="mb-8 flex flex-col items-center gap-6 text-center">
                {/* WhatsApp Icon Circle */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/10">
                  <Image
                    src="/assets/icons/whatsapp-gradient.svg"
                    alt="WhatsApp"
                    width={42}
                    height={42}
                    className="shrink-0"
                  />
                </div>

                {/* Title */}
                <h3 className="font-freight text-[40px] leading-tight text-black">
                  Login com WhatsApp
                </h3>
              </div>

              {/* Instructions */}
              <p className="mb-8 text-center font-manrope text-[16px] leading-[1.65] tracking-[0.2px] text-greyscale-500">
                Digite o código de verificação de seis dígitos enviado para o número{' '}
                <strong>{phoneNumber}</strong>
              </p>

              {/* 6-Digit Code Input */}
              <div className="mb-6 flex justify-center">
                <VerificationCodeInput
                  length={6}
                  separatorPosition={3}
                  onComplete={handleCodeComplete}
                />
              </div>

              {/* Error Message */}
              {error && (
                <p className="mb-4 text-center font-inter text-sm text-red-500">{error}</p>
              )}

              {/* Success Message */}
              {successMessage && (
                <p className="mb-4 text-center font-inter text-sm text-green-600">{successMessage}</p>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-4">
                <Button
                  variant="primary"
                  size="default"
                  onClick={handleValidate}
                  disabled={isVerifying || code.length !== 6}
                  className="w-full"
                >
                  {isVerifying ? 'Validando...' : 'Validar'}
                </Button>

                <Button
                  variant="secondary"
                  size="default"
                  onClick={onBack}
                  disabled={isVerifying}
                  className="w-full"
                >
                  Voltar
                </Button>
              </div>

              {/* Resend Code Link */}
              <div className="mt-6 text-center">
                <button
                  className="font-inter text-sm text-greyscale-600 underline hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleResendCode}
                  disabled={isResending || isVerifying}
                >
                  {isResending ? 'Reenviando...' : 'Não recebeu o código? Reenviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Login page - Tela de Boas-Vindas + Verificação WhatsApp
 * Design baseado no Figma (node-id: 286:1666)
 * Background:
 * - Mobile: Slideshow entre yoga-1 e yoga-2 com transições suaves
 * - Desktop: Efeito parallax responsivo ao movimento do mouse
 */
export default function LoginPage() {
  const router = useRouter();

  // Step management
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Parallax & UI state
  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [spotlightsReady, setSpotlightsReady] = useState(false);
  const [spotlightsSettled, setSpotlightsSettled] = useState(false);

  const modelSpotlights = useMemo<ModelSpotlight[]>(
    () => [
      {
        id: 'yoga-1',
        badge: 'Editorial IA',
        title: 'Texturas preservadas',
        caption: 'Modelos realistas para catálogos premium',
        alt: 'Modelo feminina em pose de estúdio com look esportivo',
        image: '/assets/images/background-yoga-1.png',

        // 🎯 POSIÇÃO DINÂMICA: Perto no login, longe no phone/verify
        position: currentStep === 'login'
          ? { top: 20, left: -200 }   // LoginStep: posição original
          : { top: 20, left: -250 },  // Phone/Verify: levemente afastado

        // 📏 TAMANHO DO CARD (largura x altura em pixels)
        size: { width: 240, height: 330 },

        // 🔄 ROTAÇÃO (em graus)
        // Valores positivos = inclina pra direita
        // Valores negativos = inclina pra esquerda
        // Tente: 5, 7, 9, 12, 15
        rotation: 12,

        // 🖱️ INTENSIDADE DO PARALLAX (movimento do mouse)
        // x: horizontal (valores negativos = move pra esquerda com mouse)
        // y: vertical (valores positivos = move pra baixo com mouse)
        translate: { x: -14, y: 11 },

        objectPosition: 'center 12%',
        zIndex: 6,

        // ✨ ANIMAÇÃO DE ENTRADA (como o card aparece)
        entry: {
          // offset: posição inicial antes de animar
          offset: { x: -160, y: 150 },
          // rotation: rotação inicial
          rotation: 2,
          // scale: tamanho inicial (0.78 = 78%)
          scale: 0.78,
          // delay: atraso em milissegundos
          delay: 90,
        },
      },
      {
        id: 'yoga-2',
        badge: 'Campanha Global',
        title: '20 poses em minutos',
        caption: 'Pronto para e-commerce e redes sociais',
        alt: 'Modelo feminina em cena conceitual com iluminação suave',
        image: '/assets/images/background-yoga-2.png',

        // 🎯 POSIÇÃO DINÂMICA: Perto no login, longe no phone/verify
        position: currentStep === 'login'
          ? { bottom: 30, right: -240 }  // LoginStep: posição original
          : { bottom: 30, right: -290 }, // Phone/Verify: levemente afastado

        // 📏 TAMANHO DO CARD (largura x altura em pixels)
        size: { width: 250, height: 330 },

        // 🔄 ROTAÇÃO (em graus)
        // Valores negativos = inclina pra esquerda
        // Valores positivos = inclina pra direita
        // Tente: -15, -12, -10, -7, -5
        rotation: -12,

        // 🖱️ INTENSIDADE DO PARALLAX (movimento do mouse)
        // x: horizontal (valores negativos = move pra esquerda com mouse)
        // y: vertical (valores positivos = move pra baixo com mouse)
        translate: { x: -16, y: 12 },

        objectPosition: 'center 68%',
        zIndex: 5,

        // ✨ ANIMAÇÃO DE ENTRADA (como o card aparece)
        entry: {
          // offset: posição inicial antes de animar
          offset: { x: 170, y: -160 },
          // rotation: rotação inicial
          rotation: -4,
          // scale: tamanho inicial (0.78 = 78%)
          scale: 0.78,
          // delay: atraso em milissegundos
          delay: 160,
        },
      },
    ],
    [currentStep],
  );

  const maxEntryDelay = useMemo(
    () => Math.max(...modelSpotlights.map((spotlight) => spotlight.entry.delay), 0),
    [modelSpotlights],
  );

  // Garante que o componente está montado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detecta se é desktop (>= 1024px)
  useEffect(() => {
    if (!mounted) return;

    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);

    return () => window.removeEventListener('resize', checkIsDesktop);
  }, [mounted]);

  // Slideshow automático para mobile: alterna entre yoga-1 e yoga-2 a cada 5 segundos
  useEffect(() => {
    if (!mounted) return; // Aguarda component mount

    // Detecta mobile diretamente sem depender de isDesktop state
    const checkIsMobile = () => typeof window !== 'undefined' && window.innerWidth < 1024;
    if (!checkIsMobile()) return; // Só ativa slideshow no mobile

    // Garante que começa no índice 0
    setCurrentImageIndex(0);

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === 0 ? 1 : 0));
    }, 3000);

    return () => clearInterval(interval);
  }, [mounted]);

  // Mouse tracking para parallax (desktop only)
  useEffect(() => {
    if (!isDesktop) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Normaliza a posição do mouse para valores entre -1 e 1
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDesktop]);

  // Debug log (temporary)
  useEffect(() => {
    console.log('[LoginPage Debug]', {
      mounted,
      isDesktop,
      currentImageIndex,
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'SSR',
    });
  }, [mounted, isDesktop, currentImageIndex]);

  // Entrada animada para os spotlights (desktop)
  useEffect(() => {
    if (!isDesktop) {
      setSpotlightsReady(false);
      setSpotlightsSettled(false);
      return;
    }

    console.log('Desktop detected - showing spotlights');
    setSpotlightsReady(false);
    setSpotlightsSettled(false);

    let settleTimer: number | undefined;
    const frame = requestAnimationFrame(() => {
      setSpotlightsReady(true);
      console.log('Spotlights ready');
      settleTimer = window.setTimeout(() => {
        setSpotlightsSettled(true);
        console.log('Spotlights settled');
      }, 700 + maxEntryDelay);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (settleTimer) {
        window.clearTimeout(settleTimer);
      }
    };
  }, [isDesktop, maxEntryDelay]);

  return (
    <div className="relative flex min-h-screen items-end justify-center overflow-hidden lg:items-center">
      {/* Background com Parallax (desktop) ou Slideshow (mobile) - Apenas no Login */}
      {currentStep === 'login' && (
        <div className="fixed inset-0 -z-10 pointer-events-none lg:hidden">
        <div className="relative h-screen w-full overflow-hidden">
          {/* Yoga Image 1 - Camada de fundo (movimento menor) */}
          <div
            className="absolute inset-0 will-change-transform pointer-events-none"
            style={
              isDesktop
                ? {
                    transform: `translate3d(${mousePosition.x * 15}px, ${mousePosition.y * 15}px, 0) scale(1.1)`,
                    transition: 'transform 0.1s ease-out',
                  }
                : {
                    transform: 'scale(1.2)',
                  }
            }
          >
            <img
              src="/assets/images/background-yoga-1.png"
              alt="Yoga model background 1"
              className="h-full w-full object-cover transition-opacity duration-800 select-none pointer-events-none"
              draggable="false"
              style={{
                opacity: isDesktop ? 1 : currentImageIndex === 0 ? 1 : 0,
                objectPosition: isDesktop ? 'center' : 'center 30%',
              }}
            />
          </div>

          {/* Yoga Image 2 - Camada frontal (movimento maior) */}
          <div
            className="absolute inset-0 will-change-transform pointer-events-none"
            style={
              isDesktop
                ? {
                    transform: `translate3d(${mousePosition.x * 30}px, ${mousePosition.y * 30}px, 0) scale(1.1)`,
                    transition: 'transform 0.1s ease-out',
                    opacity: 0.7,
                  }
                : {
                    transform: 'scale(1.2)',
                  }
            }
          >
            <img
              src="/assets/images/background-yoga-2.png"
              alt="Yoga model background 2"
              className="h-full w-full object-cover transition-opacity duration-800 select-none pointer-events-none"
              draggable="false"
              style={{
                opacity: isDesktop ? 0.7 : currentImageIndex === 1 ? 1 : 0,
                objectPosition: isDesktop ? 'center' : 'center 30%',
              }}
            />
          </div>

          {/* Gradient Overlay */}
          <div
            className="absolute inset-x-0 bottom-0 h-[524px] pointer-events-none lg:inset-0 lg:h-full"
            style={{
              background: isDesktop
                ? 'linear-gradient(180deg, rgba(255,255,255,0) 7.242%, rgba(255,255,255,0.4) 45%, #ffffff 61.522%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.7) 50%, #ffffff 75%)',
            }}
          />
        </div>
      </div>
      )}

      {/* Main Content Container */}
      <div className="relative z-10 w-full">
        {currentStep === 'login' ? (
          <LoginStep
            onWhatsAppClick={async () => {
              console.log('Navigating to phone input step...');
              setCurrentStep('phone');
            }}
            onAppleClick={() => {
              // TODO: Implement Apple ID authentication
              console.log('Apple ID login clicked');
            }}
          />
        ) : currentStep === 'phone' ? (
          <PhoneStep
            onSubmit={(phone) => {
              console.log('Phone number submitted:', phone);
              setPhoneNumber(phone);
              setCurrentStep('verify');
            }}
            onBack={() => {
              setCurrentStep('login');
              setPhoneNumber('');
            }}
          />
        ) : (
          <VerifyStep
            phoneNumber={phoneNumber}
            onValidate={async (code, isNewUser) => {
              console.log('Code validated:', code, 'isNewUser:', isNewUser);

              // New users go to onboarding, existing users go to dashboard
              if (isNewUser) {
                router.push('/onboarding');
              } else {
                router.push('/dashboard');
              }
            }}
            onBack={() => {
              setCurrentStep('phone');
            }}
          />
        )}

        {/* Desktop Spotlight Cards */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
            <div className="flex h-full w-full items-center justify-center px-8">
              <div className="relative w-full max-w-[1400px]">
                <div className="flex items-center justify-between gap-16">
                  <div className="flex-[0.7]" />
                  <div className="relative flex flex-[1.3] items-center justify-center">
                    <div className="relative w-full max-w-[340px]">
                      {modelSpotlights.map((spotlight) => {
                        const baseRotation = `rotate(${spotlight.rotation}deg)`;
                        const parallaxTranslation = isDesktop
                          ? `translate3d(${mousePosition.x * spotlight.translate.x}px, ${
                              mousePosition.y * spotlight.translate.y
                            }px, 0)`
                          : 'translate3d(0px, 0px, 0)';
                        const finalTransform = `${parallaxTranslation} ${baseRotation}`;
                        const entryTransform = `translate3d(${spotlight.entry.offset.x}px, ${spotlight.entry.offset.y}px, 0) scale(${spotlight.entry.scale}) rotate(${spotlight.entry.rotation}deg)`;
                        const transform = spotlightsReady ? finalTransform : entryTransform;
                        const transitionDuration = spotlightsSettled ? '0.25s' : '0.75s';
                        const transitionTimingFunction = spotlightsSettled
                          ? 'cubic-bezier(0.27, 0.67, 0.4, 0.98)'
                          : 'cubic-bezier(0.16, 1, 0.3, 1)';
                        const transitionDelay = spotlightsSettled ? '0ms' : `${spotlight.entry.delay}ms`;

                        return (
                          <div
                            key={spotlight.id}
                            className="absolute overflow-hidden rounded-[32px] border border-white/30 bg-white/12 shadow-[0_32px_70px_-24px_rgba(24,22,35,0.55)] backdrop-blur-[2px] will-change-transform"
                            style={{
                              ...toCSSPosition(spotlight.position),
                              width: `${spotlight.size.width}px`,
                              height: `${spotlight.size.height}px`,
                              zIndex: spotlight.zIndex,
                              transform,
                              opacity: spotlightsReady ? 1 : 0,
                              transition: `transform ${transitionDuration} ${transitionTimingFunction}, opacity 0.6s ease, top 0.8s cubic-bezier(0.16, 1, 0.3, 1), left 0.8s cubic-bezier(0.16, 1, 0.3, 1), right 0.8s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.8s cubic-bezier(0.16, 1, 0.3, 1)`,
                              transitionDelay,
                            }}
                          >
                            <Image
                              src={spotlight.image}
                              alt={spotlight.alt}
                              fill
                              sizes="(min-width: 1024px) 320px, 100vw"
                              className="object-cover"
                              style={{ objectPosition: spotlight.objectPosition }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent mix-blend-multiply" />
                            <div className="absolute inset-x-4 bottom-4 text-white drop-shadow-[0_6px_20px_rgba(13,15,20,0.35)]">
                              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]">
                                {spotlight.badge}
                              </span>
                              <p className="mt-3 font-freight text-[22px] leading-tight">
                                {spotlight.title}
                              </p>
                              <p className="mt-1 font-haas text-xs text-white/80">
                                {spotlight.caption}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

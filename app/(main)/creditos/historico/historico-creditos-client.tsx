'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
  Download,
  Gift,
  MessageSquare,
  Wand2,
  Image,
  RefreshCw,
  CreditCard,
} from 'lucide-react';

interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number | null;
  transaction_type: string;
  description: string | null;
  metadata: any;
  created_at: string;
}

interface HistoricoCreditosClientProps {
  transactions: CreditTransaction[];
}

const TRANSACTION_ICONS: Record<string, React.ElementType> = {
  image_generation: Sparkles,
  generation: Sparkles,
  image_download: Download,
  download: Download,
  purchase: CreditCard,
  refund: RefreshCw,
  initial_credits: Gift,
  bonus: Gift,
  chat_generation: MessageSquare,
  chat_refinement: Wand2,
  improvement: Wand2,
  edit: Wand2,
};

const TRANSACTION_LABELS: Record<string, string> = {
  image_generation: 'Geração de Imagem',
  generation: 'Geração de Imagem',
  image_download: 'Download de Imagem',
  download: 'Download de Imagem',
  purchase: 'Compra de Créditos',
  refund: 'Reembolso',
  initial_credits: 'Créditos Iniciais',
  bonus: 'Bônus',
  chat_generation: 'Geração via Chat',
  chat_refinement: 'Refinamento de Imagem',
  improvement: 'Melhoria de Imagem',
  edit: 'Edição de Imagem',
};

// Translate description to Portuguese
function translateDescription(description: string | null): string {
  if (!description) return 'Sem descrição';

  // Common patterns to translate
  const translations: [RegExp | string, string][] = [
    [/Virtual try-on generation with (\d+) garment\(s\)/i, 'Prova virtual com $1 peça(s)'],
    [/Virtual try-on with (\d+) piece\(s\)/i, 'Prova virtual com $1 peça(s)'],
    [/Image generation/i, 'Geração de imagem'],
    [/Image improvement/i, 'Melhoria de imagem'],
    [/Image edit/i, 'Edição de imagem'],
    [/Chat generation/i, 'Geração via chat'],
    [/Chat refinement/i, 'Refinamento via chat'],
    [/Image download/i, 'Download de imagem'],
    [/Download completed/i, 'Download concluído'],
    [/Credits purchase/i, 'Compra de créditos'],
    [/Initial credits/i, 'Créditos iniciais'],
    [/Bonus credits/i, 'Créditos de bônus'],
    [/Refund/i, 'Reembolso'],
    [/garment/gi, 'peça'],
    [/piece/gi, 'peça'],
    [/model/gi, 'modelo'],
    [/background/gi, 'fundo'],
    [/generation/gi, 'geração'],
  ];

  let translated = description;
  for (const [pattern, replacement] of translations) {
    if (typeof pattern === 'string') {
      translated = translated.replace(pattern, replacement);
    } else {
      translated = translated.replace(pattern, replacement);
    }
  }

  return translated;
}

// Format metadata for display (returns null if nothing useful to show)
function formatMetadata(
  transactionType: string,
  metadata: any
): { label: string; value: string }[] | null {
  if (!metadata || typeof metadata !== 'object') return null;

  const formatted: { label: string; value: string }[] = [];

  // For generations, show only relevant user-friendly info
  if (
    transactionType === 'generation' ||
    transactionType === 'image_generation' ||
    transactionType === 'chat_generation'
  ) {
    // Number of pieces
    if (metadata.upload_ids?.length) {
      formatted.push({
        label: 'Peças utilizadas',
        value: `${metadata.upload_ids.length}`,
      });
    }

    // Credits breakdown (only if there are AI edits)
    if (metadata.credits_breakdown) {
      const { aiEdits } = metadata.credits_breakdown;
      if (aiEdits) {
        const extras = [];
        if (aiEdits.addLogo > 0) extras.push('Logo');
        if (aiEdits.changeBackground > 0) extras.push('Troca de fundo');
        if (aiEdits.removeBackground > 0) extras.push('Remoção de fundo');
        if (extras.length > 0) {
          formatted.push({
            label: 'Extras aplicados',
            value: extras.join(', '),
          });
        }
      }
    }

    // Return null if we only have the basic info (don't clutter the UI)
    if (formatted.length === 0) return null;
  }

  // For purchases, show package info
  if (transactionType === 'purchase') {
    if (metadata.package_name) {
      formatted.push({
        label: 'Pacote',
        value: metadata.package_name,
      });
    }
    if (metadata.payment_method) {
      formatted.push({
        label: 'Forma de pagamento',
        value: metadata.payment_method,
      });
    }
  }

  // For downloads, show image info
  if (transactionType === 'download' || transactionType === 'image_download') {
    if (metadata.image_id) {
      formatted.push({
        label: 'ID da imagem',
        value: metadata.image_id.slice(0, 8) + '...',
      });
    }
  }

  return formatted.length > 0 ? formatted : null;
}

export default function HistoricoCreditosClient({
  transactions,
}: HistoricoCreditosClientProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-freight text-3xl font-medium text-[#111827]">
          Histórico de Gastos
        </h1>
        <p className="mt-2 font-inter text-base text-[#4b5563]">
          Todas as transações e uso de créditos da sua conta.
        </p>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="rounded-[28px] border border-white/60 bg-white/80 p-12 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Sparkles className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-freight text-xl font-medium text-gray-900">
            Nenhuma transação ainda
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Suas transações de créditos aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const isPositive = transaction.amount > 0;
            const Icon =
              TRANSACTION_ICONS[transaction.transaction_type] || Sparkles;
            const label =
              TRANSACTION_LABELS[transaction.transaction_type] ||
              formatTransactionType(transaction.transaction_type);
            const translatedDescription = translateDescription(
              transaction.description
            );
            const formattedMetadata = formatMetadata(
              transaction.transaction_type,
              transaction.metadata
            );

            return (
              <div
                key={transaction.id}
                className="rounded-[24px] border border-white/60 bg-white/80 p-5 shadow-lg backdrop-blur-xl transition-all hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Icon + Info */}
                  <div className="flex flex-1 items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        isPositive
                          ? 'bg-[#f4f0e7] text-[#b08c4a]'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-freight text-lg font-medium text-gray-900">
                        {label}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {translatedDescription}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {format(
                          new Date(transaction.created_at),
                          "d 'de' MMMM 'de' yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>

                      {/* Formatted metadata (only useful info) */}
                      {formattedMetadata && formattedMetadata.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {formattedMetadata.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                            >
                              <span className="font-medium">{item.label}:</span>
                              <span>{item.value}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right">
                    <div
                      className={`flex items-center gap-1 font-inter text-lg font-bold ${
                        isPositive ? 'text-[#b08c4a]' : 'text-slate-600'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpCircle className="h-5 w-5" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5" />
                      )}
                      <span>
                        {isPositive ? '+' : ''}
                        {transaction.amount}
                      </span>
                    </div>
                    {transaction.balance_after !== null && (
                      <p className="mt-1 text-xs text-gray-500">
                        Saldo: {transaction.balance_after} créditos
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

// Format unknown transaction types to readable Portuguese
function formatTransactionType(type: string): string {
  // Convert snake_case to readable text
  const formatted = type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  // Common translations
  const translations: Record<string, string> = {
    'Image Generation': 'Geração de Imagem',
    'Image Download': 'Download de Imagem',
    'Chat Generation': 'Geração via Chat',
    'Chat Refinement': 'Refinamento via Chat',
    'Improvement': 'Melhoria',
    'Edit': 'Edição',
    'Purchase': 'Compra',
    'Refund': 'Reembolso',
    'Bonus': 'Bônus',
    'Initial Credits': 'Créditos Iniciais',
  };

  return translations[formatted] || formatted;
}

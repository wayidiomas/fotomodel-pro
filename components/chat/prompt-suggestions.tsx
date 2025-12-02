'use client';

import * as React from 'react';

const SUGGESTIONS = [
  {
    title: 'Vestido Casual',
    prompt: 'Quero criar uma modelo feminina usando um vestido floral casual',
    accent: 'from-pink-200 to-rose-200',
    icon: (
      <svg className="h-5 w-5 text-[#20202a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 3l-3 7v11h12V10l-3-7" />
      </svg>
    ),
  },
  {
    title: 'Look Executivo',
    prompt: 'Preciso de uma modelo com terno e gravata, estilo executivo masculino',
    accent: 'from-slate-200 to-gray-200',
    icon: (
      <svg className="h-5 w-5 text-[#20202a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 4l3 4 3-4m-3 4v12" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 20h10l1-10-4-3H10l-4 3z" />
      </svg>
    ),
  },
  {
    title: 'Blusa + Calça',
    prompt: 'Modelo feminina com blusa branca e calça jeans azul',
    accent: 'from-blue-200 to-sky-200',
    icon: (
      <svg className="h-5 w-5 text-[#20202a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 3h8l1 5-3 3v10H10V11L7 8z" />
      </svg>
    ),
  },
  {
    title: 'Jaqueta de Couro',
    prompt: 'Modelo masculino usando jaqueta de couro preta e calça escura',
    accent: 'from-amber-200 to-orange-200',
    icon: (
      <svg className="h-5 w-5 text-[#20202a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 5l4-2h4l4 2-1 14H7L6 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 7v11" />
      </svg>
    ),
  },
];

interface PromptSuggestionsProps {
  onSelectSuggestion: (prompt: string) => void;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelectSuggestion,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[#20202a]">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 6v6l3 3" />
        </svg>
        <p className="font-inter text-sm font-semibold">Sugestões rápidas</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectSuggestion(suggestion.prompt)}
            className="group flex items-start gap-3 rounded-2xl border border-white/60 bg-white/80 p-4 text-left shadow transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${suggestion.accent} shadow`}>
              {suggestion.icon}
            </div>
            <div className="flex-1">
              <p className="font-inter text-sm font-medium text-gray-900 group-hover:text-[#20202a]">
                {suggestion.title}
              </p>
              <p className="mt-0.5 font-inter text-xs text-gray-600">
                {suggestion.prompt}
              </p>
            </div>
            <svg
              className="h-4 w-4 flex-shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

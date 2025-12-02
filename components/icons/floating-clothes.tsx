import * as React from 'react';

export interface FloatingClothesProps extends React.SVGProps<SVGSVGElement> {}

export const FloatingClothes: React.FC<FloatingClothesProps> = (props) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Camiseta Flutuante */}
      <path
        d="M9 3L7 5V8H4L3 9V13L4 14H7V17H9L10 18H14L15 17H17V14H20L21 13V9L20 8H17V5L15 3H9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Gola/Pescoço */}
      <path
        d="M11 3C11 3.55228 11.4477 4 12 4C12.5523 4 13 3.55228 13 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Linhas de movimento/flutuação - superior esquerda */}
      <path
        d="M2 2L4 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M3 4L5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Linhas de movimento/flutuação - superior direita */}
      <path
        d="M22 2L20 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M21 4L19 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Linhas de movimento/flutuação - inferior */}
      <path
        d="M2 20L4 19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M22 20L20 19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
};

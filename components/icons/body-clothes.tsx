import * as React from 'react';

export interface BodyClothesProps extends React.SVGProps<SVGSVGElement> {}

export const BodyClothes: React.FC<BodyClothesProps> = (props) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Cabeça */}
      <circle
        cx="12"
        cy="4"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Corpo/Torso com roupa */}
      <path
        d="M8 8C8 7 9 6 12 6C15 6 16 7 16 8V15C16 15.5 15.5 16 15 16H9C8.5 16 8 15.5 8 15V8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Mangas */}
      <path
        d="M8 8L6 10V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 8L18 10V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pernas */}
      <path
        d="M10 16V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 16V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Detalhe da roupa (linha central) */}
      <path
        d="M12 8V14"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
};

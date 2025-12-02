import * as React from 'react';

export interface MannequinModelProps extends React.SVGProps<SVGSVGElement> {}

export const MannequinModel: React.FC<MannequinModelProps> = (props) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g id="mannequin">
        {/* Cabeça */}
        <circle
          cx="12"
          cy="5"
          r="2.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Corpo/Torso */}
        <path
          d="M12 7.5 L12 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Ombros/Braços */}
        <path
          d="M7 10 L12 8 L17 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Quadril/Pernas */}
        <path
          d="M9 14 L12 14 L15 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9 14 L9 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M15 14 L15 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Pés */}
        <line
          x1="8"
          y1="20"
          x2="10"
          y2="20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="14"
          y1="20"
          x2="16"
          y2="20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

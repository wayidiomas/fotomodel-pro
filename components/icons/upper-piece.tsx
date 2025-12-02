import * as React from 'react';

export interface UpperPieceIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const UpperPieceIcon: React.FC<UpperPieceIconProps> = ({
  size = 48,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Gola/neckline */}
    <path
      d="M18 12c0-2 2-3 6-3s6 1 6 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Corpo da camiseta/shirt body */}
    <path
      d="M12 14h24v19c0 2-1 4-3 4H15c-2 0-3-2-3-4V14z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Manga esquerda/left sleeve */}
    <path
      d="M12 14l-4 2v8l4-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Manga direita/right sleeve */}
    <path
      d="M36 14l4 2v8l-4-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Costura central/center seam */}
    <path
      d="M24 14v16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="2 2"
      opacity="0.4"
    />
  </svg>
);

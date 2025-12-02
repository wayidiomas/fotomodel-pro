import * as React from 'react';

export interface LowerPieceIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const LowerPieceIcon: React.FC<LowerPieceIconProps> = ({
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
    {/* Cintura/waistband */}
    <path
      d="M14 10h20a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Perna esquerda/left leg */}
    <path
      d="M14 14v20c0 1.5 1 3 3 3h5c1 0 2-1 2-2V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Perna direita/right leg */}
    <path
      d="M34 14v20c0 1.5-1 3-3 3h-5c-1 0-2-1-2-2V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Costura central/center seam */}
    <path
      d="M24 14v12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="2 2"
      opacity="0.4"
    />
  </svg>
);

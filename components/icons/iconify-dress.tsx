import * as React from 'react';
import { Icon } from '@iconify/react';

export interface IconifyDressProps {
  size?: number;
  className?: string;
}

// Using game-icons:dress for dress/single garment representation
export const IconifyDress: React.FC<IconifyDressProps> = ({
  size = 48,
  className,
}) => (
  <Icon
    icon="game-icons:dress"
    width={size}
    height={size}
    className={className}
    style={{ color: '#C4A574' }}
  />
);

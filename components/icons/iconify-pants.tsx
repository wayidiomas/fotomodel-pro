import * as React from 'react';
import { Icon } from '@iconify/react';

export interface IconifyPantsProps {
  size?: number;
  className?: string;
}

// Using game-icons:trousers for pants representation
export const IconifyPants: React.FC<IconifyPantsProps> = ({
  size = 48,
  className,
}) => (
  <Icon
    icon="game-icons:trousers"
    width={size}
    height={size}
    className={className}
    style={{ color: '#C4A574' }}
  />
);

import * as React from 'react';
import { Icon } from '@iconify/react';

export interface IconifyShirtProps {
  size?: number;
  className?: string;
}

export const IconifyShirt: React.FC<IconifyShirtProps> = ({
  size = 48,
  className,
}) => (
  <Icon
    icon="fa6-solid:shirt"
    width={size}
    height={size}
    className={className}
    style={{ color: '#C4A574' }}
  />
);

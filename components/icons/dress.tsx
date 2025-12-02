import * as React from 'react';

export interface DressIconProps extends React.SVGProps<SVGSVGElement> {}

export const DressIcon: React.FC<DressIconProps> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M9 2.75H8.25a.75.75 0 00-.75.75c0 1.337-.36 2.648-1.045 3.805l-1.743 3.01c-.17.293-.25.628-.222.964l.916 10.886c.032.38.347.835.832.835h10.52c.485 0 .8-.455.832-.835l.916-10.886a1.44 1.44 0 00-.222-.964l-1.743-3.01A7.107 7.107 0 0016.5 3.5a.75.75 0 00-.75-.75H15a.75.75 0 00-.75.75v.822c0 .168-.114.318-.278.36l-1.972.492a.352.352 0 01-.2 0l-1.972-.492A.37.37 0 009.75 4.322V3.5a.75.75 0 00-.75-.75z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M7.75 7.5l3 3.5m5.5-3.5l-3 3.5M9 12l-1 8m7-8l1 8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

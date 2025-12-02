import * as React from 'react';

export interface ReloadProps extends React.SVGProps<SVGSVGElement> {}

export const Reload: React.FC<ReloadProps> = (props) => {
  return (
    <svg
      width="15"
      height="11"
      viewBox="0 0 15 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.6667 0.666667H2C1.26362 0.666667 0.666667 1.26362 0.666667 2V8.66667C0.666667 9.40305 1.26362 10 2 10H12.6667C13.403 10 14 9.40305 14 8.66667V2C14 1.26362 13.403 0.666667 12.6667 0.666667Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

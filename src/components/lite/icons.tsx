import type { SVGProps } from 'react';

type IconProps = { className?: string } & Omit<SVGProps<SVGSVGElement>, 'className'>;

export function ShieldIcon({ className, ...rest }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <path
        d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 12.5l2 2 4-4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowIcon({ className, ...rest }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DeviceIcon({ className, ...rest }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="18" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function GlobeIcon({ className, ...rest }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function SparkIcon({ className, ...rest }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <path
        d="M12 3v6M12 15v6M3 12h6M15 12h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon({ className, ...rest }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AlertIcon({ className, ...rest }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <path
        d="M12 8v5M12 16.5v0.01"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function TrafficChartIcon({ className, ...rest }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <path
        d="M4 19V11M10 19V5M16 19V13M22 19V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

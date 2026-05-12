interface SuboLogoProps {
  size?: number;
  color?: string;
}

// Intrinsic dimensions of public/subo-logo.png (773 × 323).
const LOGO_ASPECT = 773 / 323;

export function SuboLogo({ size = 28 }: SuboLogoProps) {
  const width = Math.round(size * LOGO_ASPECT);
  return (
    <img
      src="/subo-logo.png"
      alt="SUBO VPN"
      width={width}
      height={size}
      loading="eager"
      decoding="async"
      style={{ height: size, width: 'auto' }}
      className="block select-none"
    />
  );
}

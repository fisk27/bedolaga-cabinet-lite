interface SuboLogoProps {
  size?: number;
  color?: string;
}

export function SuboLogo({ size = 18, color = 'currentColor' }: SuboLogoProps) {
  return (
    <div className="inline-flex select-none flex-col items-center leading-none" style={{ color }}>
      <div
        className="font-handwritten font-bold tracking-[-0.01em]"
        style={{
          fontSize: size * 1.15,
          marginBottom: size * 0.02,
        }}
      >
        Subo
      </div>
      <div
        className="bg-current opacity-85"
        style={{
          width: '92%',
          height: 1,
          marginBottom: size * 0.08,
        }}
      />
      <div
        className="font-subo font-semibold"
        style={{
          fontSize: size * 0.46,
          letterSpacing: '0.16em',
        }}
      >
        VPN
      </div>
    </div>
  );
}

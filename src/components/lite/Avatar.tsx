interface AvatarProps {
  initials: string;
}

export function Avatar({ initials }: AvatarProps) {
  return (
    <div
      className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-subo-hairline font-subo text-[13px] font-semibold tracking-[0.02em] text-subo-text"
      style={{
        background: 'linear-gradient(135deg, #5A4A2A, #2B2519)',
      }}
    >
      {initials}
    </div>
  );
}

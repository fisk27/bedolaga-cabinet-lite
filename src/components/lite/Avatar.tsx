import { useState } from 'react';

interface AvatarProps {
  initials: string;
  photoUrl?: string | null;
}

export function Avatar({ initials, photoUrl }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = !!photoUrl && !imgError;

  return (
    <div
      className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full border border-subo-hairline font-subo text-[13px] font-semibold tracking-[0.02em] text-subo-text shadow-[inset_0_0_0_1px_rgba(255,215,0,0.32),inset_0_1px_0_0_rgba(255,255,255,0.10),0_0_14px_-2px_rgba(255,215,0,0.30)]"
      style={{
        background: 'linear-gradient(135deg, #6B5631, #1A1505)',
      }}
    >
      {showImage ? (
        <img
          src={photoUrl}
          alt={initials}
          onError={() => setImgError(true)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

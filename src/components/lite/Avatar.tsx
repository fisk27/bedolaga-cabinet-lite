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
      className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full border border-subo-hairline font-subo text-[13px] font-semibold tracking-[0.02em] text-subo-text"
      style={{
        background: 'linear-gradient(135deg, #5A4A2A, #2B2519)',
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

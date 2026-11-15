import { useState } from 'react';
import { Salad as SaladIcon } from 'lucide-react';

interface SaladImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export function SaladImage({ src, alt, className = '' }: SaladImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#EEF4EC] to-[#DCE8D8] text-[#2D4F38] ${className}`}
        role="img"
        aria-label={alt}
      >
        <SaladIcon className="h-9 w-9 opacity-70" strokeWidth={1.5} />
        <span className="mt-2 px-4 text-center text-xs font-medium tracking-wide text-[#2D4F38]/80">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

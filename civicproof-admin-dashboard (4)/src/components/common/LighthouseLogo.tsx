import React, { useState } from 'react';

export const LighthouseLogo: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 38,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title="Namma Ooru Admin Portal"
    >
      {!imgError ? (
        <img
          src="/namma-ooru-lighthouse.png"
          alt="Namma Ooru Lighthouse"
          width={size}
          height={size}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain select-none drop-shadow-[0_0_10px_rgba(0,229,255,0.45)]"
          draggable={false}
        />
      ) : (
        <img
          src="/namma-ooru-logo.png"
          alt="Namma Ooru Logo"
          width={size}
          height={size}
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
      )}
    </div>
  );
};

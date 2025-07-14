import React, { useState } from 'react';

interface ImageWithFallbackProps {
  src?: string;
  alt?: string;
  fallbackSrc?: string;
  style?: React.CSSProperties;
  className?: string;
}

const defaultPlaceholder = '/images/userProfilePlaceholder.png';

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, fallbackSrc, style, className }) => {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc || defaultPlaceholder);
  const handleError = () => {
    setImgSrc(fallbackSrc || defaultPlaceholder);
  };
  return (
    <img
      src={imgSrc}
      alt={alt || 'image'}
      style={style}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default ImageWithFallback;

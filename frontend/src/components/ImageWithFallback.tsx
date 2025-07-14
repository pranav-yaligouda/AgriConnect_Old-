import React, { ImgHTMLAttributes } from 'react';

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

/**
 * A robust image component that falls back to a local asset if the original fails.
 * Usage:
 * <ImageWithFallback src={imageUrl} fallbackSrc="/product-placeholder.jpg" alt="..." />
 */
const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ fallbackSrc = '/product-placeholder.jpg', ...props }) => {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = fallbackSrc;
  };
  return <img {...props} onError={handleError} />;
};

export default ImageWithFallback;

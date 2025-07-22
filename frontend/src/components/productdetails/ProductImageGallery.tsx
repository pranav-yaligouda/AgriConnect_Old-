import React, { useState } from "react";
import { Box, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ images, alt }) => {
  const [selected, setSelected] = useState(0);

  const handlePrev = () => setSelected((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const handleNext = () => setSelected((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <Box position="relative" width="100%" maxWidth={480} mx="auto">
      <img
        src={images[selected] || "/product-placeholder.jpg"}
        alt={alt}
        style={{
          width: "100%",
          height: 360,
          objectFit: "cover",
          borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      />
      {images.length > 1 && (
        <>
          <IconButton
            onClick={handlePrev}
            sx={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)" }}
            aria-label="Previous image"
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)" }}
            aria-label="Next image"
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </>
      )}
      <Box display="flex" justifyContent="center" mt={2} gap={1}>
        {images.map((img, idx) => (
          <Box
            key={img + idx}
            onClick={() => setSelected(idx)}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              overflow: "hidden",
              border: idx === selected ? "2px solid #1976d2" : "2px solid transparent",
              cursor: "pointer",
              boxShadow: idx === selected ? 3 : 1,
            }}
          >
            <img src={img || "/product-placeholder.jpg"} alt={`${alt} ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ProductImageGallery; 
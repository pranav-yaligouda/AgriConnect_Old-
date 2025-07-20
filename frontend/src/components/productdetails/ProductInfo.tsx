import React from "react";
import { Box, Typography, Chip } from "@mui/material";

const ProductInfo = ({ product }: { product: any }) => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
        {product.name}
      </Typography>
      {product.isOrganic && (
        <Chip label="Organic" color="success" size="small" sx={{ mb: 2, fontWeight: 600 }} />
      )}
      <Typography variant="h5" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
        ₹{product.price}/{product.unit}
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
        {product.description}
      </Typography>
    </Box>
  );
};

export default ProductInfo; 
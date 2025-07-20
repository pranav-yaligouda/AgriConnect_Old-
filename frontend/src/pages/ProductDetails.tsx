import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Container, CircularProgress, Box, Typography } from "@mui/material";
import ProductImageGallery from "../components/productdetails/ProductImageGallery";
import ProductInfo from "../components/productdetails/ProductInfo";
import ProductStatsGrid from "../components/productdetails/ProductStatsGrid";
import SellerInfoCard from "../components/productdetails/SellerInfoCard";
import ProductTabs from "../components/productdetails/ProductTabs";
import ContactSellerSection from "../components/productdetails/ContactSellerSection";
import ErrorBoundary from "../components/ErrorBoundary";
import { fetchProductById } from "../services/apiService";
import { useTranslation } from "react-i18next";

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => (id ? fetchProductById(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box textAlign="center" py={8}>
        <Typography color="error" variant="h5">
          {t("productDetails.notFound")}
        </Typography>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 6 } }}>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={4}>
          <Box flex={1}>
            <ProductImageGallery images={product.images} alt={product.name} />
          </Box>
          <Box flex={2} display="flex" flexDirection="column" gap={3}>
            <ProductInfo product={product} />
            <ProductStatsGrid product={product} />
            <SellerInfoCard farmer={product.farmer} />
            <ContactSellerSection product={product} />
          </Box>
              </Box>
        <Box mt={6}>
          <ProductTabs product={product} />
          </Box>
    </Container>
    </ErrorBoundary>
  );
};

export default ProductDetailsPage;

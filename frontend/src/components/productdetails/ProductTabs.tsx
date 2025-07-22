import React, { useState } from "react";
import { Box, Paper, Tabs, Tab, Typography, useTheme, useMediaQuery } from "@mui/material";
import NutritionTable from "./NutritionTable";
import SellerInfoCard from "./SellerInfoCard";

const ProductTabs = ({ product }: { product: any }) => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleTabChange = (_: any, newValue: number) => setTabValue(newValue);

  const defaultNutritionalInfo = {
    calories: 0,
    protein: "Not specified",
    carbs: "Not specified",
    fat: "Not specified",
    fiber: "Not specified",
    vitamins: "Not specified",
  };

  return (
    <Paper sx={{ boxShadow: 1 }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="product details tabs"
        variant={isMobile ? "scrollable" : "standard"}
        allowScrollButtonsMobile
        sx={{
          "& .MuiTabs-indicator": { backgroundColor: theme.palette.primary.main },
          "& .MuiTab-root": {
            fontSize: isMobile ? "0.7rem" : "0.875rem",
            minWidth: "unset",
            padding: isMobile ? "6px 12px" : "12px 16px",
            whiteSpace: "nowrap",
          },
        }}
      >
        <Tab label={<Box component="span" sx={{ minWidth: 80 }}>Product Details</Box>} />
        <Tab label={<Box component="span" sx={{ minWidth: 80 }}>Nutritional Info</Box>} />
        <Tab label={<Box component="span" sx={{ minWidth: 60 }}>Seller Info</Box>} />
      </Tabs>
      <Box sx={{ p: 3 }}>
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>About This Product</Typography>
            <Typography variant="body1" paragraph>{product.description}</Typography>
            <Typography variant="h6" gutterBottom>Key Features</Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body1">Freshly Harvested {new Date(product.harvestDate).toLocaleDateString()}</Typography>
              </Box>
              {product.isOrganic && (
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body1">Organically Grown</Typography>
                </Box>
              )}
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body1">Directly Sourced</Typography>
              </Box>
            </Box>
          </Box>
        )}
        {tabValue === 1 && (
          <NutritionTable nutrition={product.nutritionalInfo || defaultNutritionalInfo} />
        )}
        {tabValue === 2 && (
          <SellerInfoCard farmer={product.farmer} />
        )}
      </Box>
    </Paper>
  );
};

export default ProductTabs; 
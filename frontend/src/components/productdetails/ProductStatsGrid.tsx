import React from "react";
import { Grid, Box, Typography, Chip, Tooltip } from "@mui/material";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const ProductStatsGrid = ({ product }: { product: any }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={6} md={3}>
        <Tooltip title="Harvest Date">
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarTodayIcon color="primary" fontSize="small" />
            <Box>
              <Typography variant="caption" color="text.secondary">Harvest Date</Typography>
              <Typography variant="body2">{new Date(product.harvestDate).toLocaleDateString()}</Typography>
            </Box>
          </Box>
        </Tooltip>
      </Grid>
      <Grid item xs={6} md={3}>
        <Tooltip title="Location">
          <Box display="flex" alignItems="center" gap={1}>
            <LocationOnIcon color="primary" fontSize="small" />
            <Box>
              <Typography variant="caption" color="text.secondary">Location</Typography>
              <Typography variant="body2">{product.location?.district}, {product.location?.state}</Typography>
            </Box>
          </Box>
        </Tooltip>
      </Grid>
      <Grid item xs={6} md={3}>
        <Tooltip title="Available Quantity">
          <Box display="flex" alignItems="center" gap={1}>
            <InventoryIcon color="primary" fontSize="small" />
            <Box>
              <Typography variant="caption" color="text.secondary">Available</Typography>
              <Typography variant="body2">{product.availableQuantity} {product.unit}</Typography>
            </Box>
          </Box>
        </Tooltip>
      </Grid>
      <Grid item xs={6} md={3}>
        <Tooltip title="Minimum Order Quantity">
          <Box display="flex" alignItems="center" gap={1}>
            <ShoppingCartIcon color="primary" fontSize="small" />
            <Box>
              <Typography variant="caption" color="text.secondary">Min Order</Typography>
              <Typography variant="body2">{product.minimumOrderQuantity ?? 'Not set'} {product.unit}</Typography>
            </Box>
          </Box>
        </Tooltip>
      </Grid>
    </Grid>
  );
};

export default ProductStatsGrid; 
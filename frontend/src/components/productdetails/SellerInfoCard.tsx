import React from "react";
import { Box, Avatar, Typography, Paper } from "@mui/material";
import LocationOnIcon from '@mui/icons-material/LocationOn';

const getRoleProfilePlaceholder = (role?: string) => {
  switch (role) {
    case 'farmer':
      return '/images/farmerProfilePlaceholder.png';
    case 'vendor':
      return '/images/vendorProfilePlaceholder.png';
    default:
      return '/images/userProfilePlaceholder.png';
  }
};

const SellerInfoCard = ({ farmer }: { farmer: any }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar
          src={farmer.profileImageUrl || getRoleProfilePlaceholder('farmer')}
          sx={{ width: 56, height: 56 }}
        />
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {farmer.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Certified Farmer
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <LocationOnIcon color="primary" fontSize="small" />
            <Typography variant="body2">
              {farmer.address?.district}, {farmer.address?.state}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default SellerInfoCard; 
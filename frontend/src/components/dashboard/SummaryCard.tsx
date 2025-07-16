import React from 'react';
import { Box, Typography } from '@mui/material';

interface SummaryCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, value, label, color }) => (
  <Box sx={{ p: 3, borderRadius: 2, bgcolor: color, color: 'white', display: 'flex', alignItems: 'center', gap: 2, boxShadow: 2 }}>
    <Box sx={{ fontSize: 40, mr: 2 }}>{icon}</Box>
    <Box>
      <Typography variant="h6" fontWeight={700}>{value}</Typography>
      <Typography variant="body2">{label}</Typography>
    </Box>
  </Box>
);

export default SummaryCard; 
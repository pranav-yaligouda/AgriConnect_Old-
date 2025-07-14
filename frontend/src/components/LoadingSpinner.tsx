import { CircularProgress, Typography, Box, useTheme, useMediaQuery } from "@mui/material";

const LoadingSpinner = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        minHeight: 200,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        p: 2
      }}
      aria-label="Loading content"
    >
      <CircularProgress 
        size={isMobile ? 40 : 56} 
        thickness={4}
        sx={{ mb: 2 }}
      />
      {!isMobile && (
        <Typography variant="body2" color="text.secondary">
          Loading content...
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
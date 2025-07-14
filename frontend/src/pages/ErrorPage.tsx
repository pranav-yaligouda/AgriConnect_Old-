import React from "react";
import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  // Try to get error code from state, fallback to 404
  const errorCode = location.state?.errorCode || 404;
  const errorMessage = location.state?.errorMessage || t("error.defaultMessage");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper elevation={6} sx={{ p: { xs: 3, md: 6 }, borderRadius: 4, maxWidth: 480, width: "100%", textAlign: "center", bgcolor: "#fff" }}>
        <Stack spacing={3} alignItems="center">
          <ErrorOutlineIcon color="error" sx={{ fontSize: 64 }} />
          <Typography variant="h2" color="primary" fontWeight="bold">{errorCode}</Typography>
          <Typography variant="h5" color="text.secondary">{errorMessage}</Typography>
          <Button variant="contained" color="primary" size="large" onClick={() => navigate("/", { replace: true })} sx={{ mt: 2 }}>
            {t("error.goHome")}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ErrorPage;

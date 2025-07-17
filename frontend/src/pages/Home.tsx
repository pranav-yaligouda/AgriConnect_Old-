import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";
import {
  LocalShipping,
  AttachMoney,
  LocationOn,
  ShoppingBasket,
  CurrencyRupee,
  VerifiedUser,
  Group,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotification } from '../contexts/NotificationContext';

const Home = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const { notify } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (location.state && location.state.registrationSuccess) {
      notify(t('register.success'), 'success');
      // Clear the state so the toast doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, notify, t]);

  const features = [
    {
      icon: (
        <ShoppingBasket
          sx={{ fontSize: 40, color: theme.palette.primary.main }}
        />
      ),
      title: t("home.featuresBoxes.freshProduce.title"),
      description: t("home.featuresBoxes.freshProduce.description"),
    },
    {
      icon: (
        <LocationOn sx={{ fontSize: 40, color: theme.palette.primary.main }} />
      ),
      title: t("home.featuresBoxes.localSourcing.title"),
      description: t("home.featuresBoxes.localSourcing.description"),
    },
    {
      icon: (
        <VerifiedUser sx={{ fontSize: 40, color: theme.palette.primary.main }} />
      ),
      title: t("home.featuresBoxes.secureTransactions.title"),
      description: t("home.featuresBoxes.secureTransactions.description"),
    },
    {
      icon: (
        <Group sx={{ fontSize: 40, color: theme.palette.primary.main }} />
      ),
      title: t("home.featuresBoxes.communitySupport.title"),
      description: t("home.featuresBoxes.communitySupport.description"),
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/hero-bg.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "80vh",
          display: "flex",
          alignItems: "center",
          color: "white",
        }}
      >
        <Container>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                }}
              >
                {t("home.hero.title")}
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: 400 }}>
                {t("home.hero.subtitle")}
              </Typography>
              <Button
                component={RouterLink}
                to="/marketplace"
                variant="contained"
                size="large"
                sx={{
                  mr: { xs: 0, md: 2 }, // Remove right margin on mobile
                  mb: { xs: 2, md: 0 }, // Add bottom margin on mobile
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                }}
              >
                {t("home.hero.exploreMarketplace")}
              </Button>
              <Button
                component={RouterLink}
                to={isLoggedIn ? "dashboard" : "register"}
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  color: "white",
                  borderColor: "white",
                  "&:hover": {
                    borderColor: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                {isLoggedIn ? t("home.hero.goToDashboard") : t("home.hero.register")}
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, backgroundColor: "background.default" }}>
        <Container>
          <Typography variant="h2" align="center" sx={{ mb: 6 }}>
            {t("home.features.title")}
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    p: 3,
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                    },
                  }}
                >
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <CardContent>
                    <Typography
                      variant="h5"
                      component="h3"
                      sx={{ mb: 2, fontWeight: 600 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      {!isLoggedIn && (
        <Box
          sx={{
            py: 8,
            backgroundColor: theme.palette.primary.main,
            color: "white",
          }}
        >
          <Container>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h3" sx={{ mb: 2 }}>
                  {t("home.cta.title")}
                </Typography>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 400 }}>
                  {t("home.cta.subtitle")}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: "center" }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  color="secondary"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                  }}
                >
                  {t("home.cta.signUp")}
                </Button>
              </Grid>
            </Grid>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default Home;

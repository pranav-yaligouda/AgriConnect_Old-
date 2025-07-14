// About.tsx
// Enhanced About page for AgriConnect
// Features: mission, values, project highlights, and a dynamic developer section
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
  Stack,
  Tooltip
} from "@mui/material";
import { LocalShipping, Nature, Security, Support, GitHub, LinkedIn, Twitter, Star, RocketLaunch, Diversity3, Public, Devices } from "@mui/icons-material";
import {
  containerPadding,
  paperStyle,
  cardStyle,
  gridSpacing,
} from "../utils/styleUtils";

const About = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Container maxWidth="xl" sx={{ ...containerPadding }}>
      {/* Hero Section */}
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          {t("about.hero.title")}
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 800, mx: "auto" }}
        >
          {t("about.hero.tagline")}
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
          <Chip icon={<RocketLaunch sx={{ color: 'primary.main' }} />} label={t("about.hero.chip1")} color="default" />
          <Chip icon={<Diversity3 sx={{ color: 'primary.main' }} />} label={t("about.hero.chip2")} color="default" />
          <Chip icon={<Devices sx={{ color: 'primary.main' }} />} label={t("about.hero.chip4")} color="default" />
        </Stack>
      </Box>

      {/* Mission Section */}
      <Paper sx={{ ...paperStyle, mb: 6 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                {t("about.mission.title")}
              </Typography>
              <Typography variant="body1" paragraph>
                {t("about.mission.paragraph1")}
              </Typography>
              <Typography variant="body1" paragraph>
                {t("about.mission.paragraph2")}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: 300,
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1500382017468-9049fed747ef)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: 2,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Project Highlights Section */}
      <Paper sx={{ ...paperStyle, mb: 6, background: 'linear-gradient(90deg, #e3ffe8 0%, #f9fbe7 100%)', boxShadow: 6 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {t("about.highlights.title")}
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Star color="primary" />
                  <Typography variant="body1" color="text.secondary">
                    {t("about.highlights.feature1")}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Star color="primary" />
                  <Typography variant="body1" color="text.secondary">
                    {t("about.highlights.feature2")}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Star color="primary" />
                  <Typography variant="body1" color="text.secondary">
                    {t("about.highlights.feature3")}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Star color="primary" />
                  <Typography variant="body1" color="text.secondary">
                    {t("about.highlights.feature4")}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              <img
                src="/favicon.svg"
                alt="AgriConnect Logo"
                style={{ width: 100, height: 100, marginBottom: 12 }}
              />
              <Typography variant="subtitle1" color="primary" fontWeight="bold">
                {t("about.highlights.tagline")}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Developer Info Section (Dynamic & Enhanced) */}
      <Paper sx={{ ...paperStyle, mb: 6, background: 'linear-gradient(90deg, #f5f7fa 0%, #c3cfe2 100%)', boxShadow: 6 }}>
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          <Grid item xs={12} md={4}>
            <Paper elevation={8} sx={{
              borderRadius: 5,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.25)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
              position: 'relative',
              overflow: 'visible',
              minHeight: 360,
              backdropFilter: 'blur(12px)',
              border: '2px solid',
              borderImage: 'linear-gradient(135deg, #7f53ac 0%, #647dee 100%) 1',
              transition: 'box-shadow 0.3s',
              '&:hover': {
                boxShadow: '0 12px 48px 0 rgba(31, 38, 135, 0.25)',
              }
            }}>
              <Box sx={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7f53ac 0%, #647dee 100%)',
                filter: 'blur(16px)',
                opacity: 0.4,
                zIndex: 0,
                animation: 'float 3s ease-in-out infinite alternate'
              }} />
              <Avatar
                alt="Pranav Yaligouda"
                src="https://avatars.githubusercontent.com/u/110262949?v=4"
                sx={{ width: 120, height: 120, mb: 2, boxShadow: 6, border: '4px solid', borderColor: 'primary.main', zIndex: 1, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05) rotate(-2deg)' } }}
              />
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ zIndex: 1 }}>
                Pranav Yaligouda
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1, zIndex: 1 }}>
                <Chip label="Full Stack Developer" color="primary" size="small" />
                <Chip label="Open Source" color="success" size="small" />
              </Stack>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ zIndex: 1, mb: 1 }}>
                {t("about.developer.bio")}
              </Typography>
              <Stack direction="row" spacing={2} mt={2} sx={{ zIndex: 1 }}>
                <Tooltip title="LinkedIn">
                  <a href="https://linkedin.com/in/pranav-yaligouda" target="_blank" rel="noopener noreferrer">
                    <LinkedIn sx={{ fontSize: 32, color: '#0a66c2', transition: 'color 0.2s, transform 0.2s', '&:hover': { color: '#1976d2', transform: 'scale(1.15)' } }} />
                  </a>
                </Tooltip>
                <Tooltip title={t("about.developer.github.tooltip")}>
                  <a href="https://github.com/pranav-yaligouda" target="_blank" rel="noopener noreferrer">
                    <GitHub sx={{ fontSize: 32, color: '#24292f', transition: 'color 0.2s, transform 0.2s', '&:hover': { color: '#1976d2', transform: 'scale(1.15)' } }} />
                  </a>
                </Tooltip>
                <Tooltip title={t("about.developer.twitter.tooltip")}>
                  <a href="https://twitter.com/pranavyaligouda" target="_blank" rel="noopener noreferrer">
                    <Twitter sx={{ fontSize: 32, color: '#1da1f2', transition: 'color 0.2s, transform 0.2s', '&:hover': { color: '#1976d2', transform: 'scale(1.15)' } }} />
                  </a>
                </Tooltip>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{
              borderRadius: 5,
              p: 4,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.10)',
              minHeight: 240,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
                Developer Mission & Vision
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {t("about.developer.mission")}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t("about.developer.collab")}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Values Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
          {t("about.values.title")}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ ...cardStyle, height: "100%", p: 3, textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Nature sx={{ fontSize: 40, color: "primary.main" }} />
              </Box>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t("about.values.sustainability")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("about.values.sustainability.description")}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ ...cardStyle, height: "100%", p: 3, textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Public sx={{ fontSize: 40, color: "primary.main" }} />
              </Box>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t("about.values.transparentConnections")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("about.values.transparentConnections.description")}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ ...cardStyle, height: "100%", p: 3, textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Security sx={{ fontSize: 40, color: "primary.main" }} />
              </Box>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t("about.values.qualityAssurance")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("about.values.qualityAssurance.description")}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ ...cardStyle, height: "100%", p: 3, textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Support sx={{ fontSize: 40, color: "primary.main" }} />
              </Box>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t("about.values.farmerSupport")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("about.values.farmerSupport.description")}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default About;

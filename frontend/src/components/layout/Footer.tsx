// Footer.tsx
// Enhanced responsive footer for AgriConnect
// Includes updated links, social icons, and responsive design for all pages
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Facebook, Twitter, Instagram, LinkedIn, Group, Forum, ShoppingBasket, InfoOutlined, HelpOutline, Home as HomeIcon } from "@mui/icons-material";
import { Link as MuiLink } from "@mui/material";

// Footer component for AgriConnect
const Footer = () => {
  const theme = useTheme();
  const year = new Date().getFullYear();

  // Footer navigation columns and links
  const footerLinks = [
    {
      title: "AgriConnect",
      links: [
        { name: "Home", url: "/", icon: <HomeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> },
        { name: "Marketplace", url: "/marketplace", icon: <ShoppingBasket fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> },
        { name: "About Us", url: "/about", icon: <InfoOutlined fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> },
        { name: "FAQ", url: "/faq", icon: <HelpOutline fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> },
      ],
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        pt: 3, // reduced from 6
        pb: 1.5, // reduced from 3
        mt: "auto",
        borderRadius: { xs: 0, md: 4 },
        boxShadow: { xs: '0 -2px 12px 0 rgba(46,125,50,0.10)', md: '0 -4px 24px 0 rgba(46,125,50,0.18)' },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Render footer columns with links */}
          {footerLinks.map((column, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Typography
                variant="h6"
                color="text.primary"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                {column.title}
              </Typography>
              <Box>
                {column.links.map((link, linkIndex) => (
                  <Link
                    key={linkIndex}
                    component={RouterLink}
                    to={link.url}
                    color="inherit"
                    sx={{
                      display: "block",
                      mb: 1,
                      textDecoration: "none",
                      fontWeight: 500,
                      '& svg': { verticalAlign: 'middle', mr: 0.5 },
                      '&:hover': { color: '#fff', textDecoration: 'underline' },
                      fontSize: '1.05rem',
                      letterSpacing: 0.2,
                      transition: 'color 0.18s',
                    }}
                  >
                    {link.icon && link.icon} {link.name}
                  </Link>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Divider />
          {/* Removed unnecessary div containing 'OR' divider */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              mt: 1.2, // reduced from 3
            }}
          >
            {/* Copyright and social icons */}
            <Typography variant="body2" color="text.secondary">
              &copy; {year} AgriConnect. All rights reserved.
            </Typography>
            <Box sx={{ mt: { xs: 2, sm: 0 } }}>
              {/* Social media icons */}
              <MuiLink
                href="https://www.facebook.com/share/1HpsbxADwa/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: "none" }}
              >
                <IconButton
                  aria-label="Facebook"
                  sx={{ color: "#3b5998", '&:hover': { color: theme.palette.primary.main } }}
                >
                  <Facebook />
                </IconButton>
              </MuiLink>
              <MuiLink
                href="https://x.com/AgriConncet"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: "none" }}
              >
                <IconButton
                  aria-label="Twitter"
                  sx={{ color: "#1da1f2", '&:hover': { color: theme.palette.primary.main } }}
                >
                  <Twitter />
                </IconButton>
              </MuiLink>
              <MuiLink
                href="https://instagram.com/connect.agriconnect"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: "none" }}
              >
                <IconButton
                  aria-label="Instagram"
                  sx={{ color: "#e1306c", '&:hover': { color: theme.palette.primary.main } }}
                >
                  <Instagram />
                </IconButton>
              </MuiLink>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

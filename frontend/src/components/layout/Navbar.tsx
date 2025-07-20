// Navbar.tsx
// Includes all main routes: Connections, Marketplace, Profile, etc.
// Provides mobile drawer and desktop layout, authentication-aware links, and user menu
import { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  Tooltip,
  Slide,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Person,
  ShoppingBasket,
  Dashboard,
  Logout,
  Login,
  InfoOutlined,
  HelpOutline,
  Group,
  Forum,
  
} from "@mui/icons-material";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import LanguageSwitcher from "../LanguageSwitcher";
import ImageWithFallback from '../ImageWithFallback';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

// Navbar component for AgriConnect
const Navbar = () => {
  const { t } = useTranslation();
  // State for user menu and mobile drawer
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Authentication status (replace with auth context in production)
  const isAuthenticated = !!user;

  // Handlers for user menu and mobile drawer
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate("/");
  };

  // Main navigation links (order: Marketplace, Dashboard, Profile)
  const mainMenuItems = [
    { text: "Marketplace", path: "/marketplace", icon: <ShoppingBasket />, auth: false },
    ...(isAuthenticated ? [{ text: "Dashboard", path: "/dashboard", icon: <Dashboard />, auth: true }] : []),
  ];

  // Helper to check if a route is active
  const isActive = (path: string) => location.pathname === path;

  // Render mobile drawer menu
  const renderMobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      PaperProps={{ sx: { width: 280, bgcolor: 'background.paper', boxShadow: 6, borderRadius: '12px 0 0 12px', overflow: 'hidden' } }}
      ModalProps={{ keepMounted: true }}
      aria-label="mobile navigation menu"
    >
      <Box sx={{ width: 280, pt: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', pb: 0, overflow: 'hidden' }}>
        {/* Drawer header with close button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ImageWithFallback
              src="/favicon.svg"
              fallbackSrc="/favicon.svg"
              alt="AgriConnect Logo"
              style={{ width: 40, height: 40, objectFit: 'contain', padding: 4 }}
            />
            <Typography variant="h6" color="primary" fontWeight="bold">
              AgriConnect
            </Typography>
          </Box>
          <IconButton aria-label="Close menu" onClick={handleMobileMenuToggle} size="large">
            <MenuIcon sx={{ transform: 'rotate(90deg)' }} />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <List>
          {(() => {
            // Insert Profile after Dashboard in mobile drawer
            const mobileMenuItems = [...mainMenuItems];
            const dashboardIdx = mobileMenuItems.findIndex(item => item.text === "Dashboard");
            // Only add Profile if not already present
            const hasProfile = mobileMenuItems.some(item => item.text === "Profile");
            if (!hasProfile && dashboardIdx !== -1) {
              mobileMenuItems.splice(dashboardIdx + 1, 0, { text: "Profile", path: "/profile", icon: <Person />, auth: true });
            }
            return mobileMenuItems.filter(item => !item.auth || isAuthenticated).map((item) => (
              <ListItem
                button
                key={item.text}
                component={RouterLink}
                to={item.path}
                onClick={handleMobileMenuToggle}
                selected={isActive(item.path)}
                sx={{
                  bgcolor: isActive(item.path) ? "rgba(46, 125, 50, 0.11)" : "transparent",
                  "&:hover": { bgcolor: "rgba(46, 125, 50, 0.13)" },
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  fontWeight: 600,
                  fontSize: '1.08rem',
                  color: isActive(item.path) ? 'primary.main' : 'text.primary',
                  transition: 'all 0.16s',
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? "primary.main" : "inherit", minWidth: 38 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? 700 : 500,
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                    fontSize: '1.08rem',
                    letterSpacing: 0.2,
                  }}
                />
              </ListItem>
            ));
          })()}

          {/* About Us always visible */}
          <ListItem
            button
            component={RouterLink}
            to="/about"
            onClick={handleMobileMenuToggle}
            selected={isActive("/about")}
            sx={{
              bgcolor: isActive("/about") ? "rgba(46, 125, 50, 0.11)" : "transparent",
              "&:hover": { bgcolor: "rgba(46, 125, 50, 0.13)" },
              borderRadius: 2,
              mx: 1,
              mb: 0.5,
              fontWeight: 600,
              fontSize: '1.08rem',
              color: isActive("/about") ? 'primary.main' : 'text.primary',
              transition: 'all 0.16s',
            }}
            aria-label="About Us"
          >
            <ListItemIcon sx={{ color: isActive("/about") ? "primary.main" : "inherit", minWidth: 38 }}>
              <InfoOutlined />
            </ListItemIcon>
            <ListItemText
              primary="About Us"
              primaryTypographyProps={{
                fontWeight: isActive("/about") ? 700 : 500,
                color: isActive("/about") ? 'primary.main' : 'inherit',
                fontSize: '1.08rem',
                letterSpacing: 0.2,
              }}
            />
          </ListItem>

          <Divider sx={{ my: 1 }} />
          {isAuthenticated ? (
            <ListItem
              button
              onClick={handleLogout}
              sx={{ mx: 1, mb: 1, borderRadius: 2, fontWeight: 600, fontSize: '1.08rem', color: 'error.main', justifyContent: 'center' }}
            >
              <ListItemIcon sx={{ color: 'error.main', minWidth: 38 }}><Logout /></ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 700, color: 'error.main', fontSize: '1.08rem', letterSpacing: 0.2 }} />
            </ListItem>
          ) : (
            <ListItem
              button
              component={RouterLink}
              to="/login"
              onClick={handleMobileMenuToggle}
              sx={{ mx: 1, mb: 1, borderRadius: 2, fontWeight: 600, fontSize: '1.08rem', color: 'primary.main', justifyContent: 'center' }}
            >
              <ListItemIcon sx={{ color: 'primary.main', minWidth: 38 }}><Login /></ListItemIcon>
              <ListItemText primary="Login" primaryTypographyProps={{ fontWeight: 700, color: 'primary.main', fontSize: '1.08rem', letterSpacing: 0.2 }} />
            </ListItem>
          )}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        {/* Language Switcher as a left-aligned menu item at the bottom */}
        <List sx={{ width: '100%', mb: 1 }}>
          <ListItem button sx={{ borderRadius: 2, mx: 1, mb: 0.5, fontWeight: 600, fontSize: '1.08rem', color: 'primary.main', alignItems: 'center' }}>
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 38 }}>
              {/* Optionally use a language icon here */}
            </ListItemIcon>
            <LanguageSwitcher drawerMenu />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );

  // Main render: responsive AppBar with logo, links, and user menu
  return (
    <>
      <Slide
        in={!isMobile || !mobileMenuOpen}
        direction="down"
        appear={false}
        mountOnEnter
        unmountOnExit={false}
      >
        <AppBar
          position="fixed"
          color="primary"
          elevation={4}
          sx={{
            zIndex: 1300,
            background: 'rgba(46, 125, 50, 0.92)',
            backdropFilter: 'blur(7px)',
            boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
          }}
          role="navigation"
          aria-label="main navigation bar"
        >
          <Container maxWidth="lg" sx={{ px: { xs: 0.5, sm: 1.5 } }}>
            <Toolbar sx={{ minHeight: { xs: 52, sm: 60 }, px: { xs: 0.5, sm: 1.5 } }}>
              {/* Logo and title */}
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, mr: { xs: 1, sm: 2 } }} id="navbar-logo-bar">
                <RouterLink
  to="/"
  style={{
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: 1,
  }}
  aria-label="Go to homepage"
>
                <img
                  src="/favicon.svg"
                  alt="AgriConnect Logo"
                  style={{ width: 38, height: 38, objectFit: 'contain', marginRight: 6, marginLeft: 2, display: 'block' }}
                />
                <Typography
                  variant="h6"
                  component="div"
                  fontWeight="bold"
                  sx={{ display: 'block', fontSize: { xs: '1.08rem', sm: '1.23rem' }, letterSpacing: 0.5, lineHeight: 1, ml: 0, mr: 0, color: 'primary.contrastText', whiteSpace: 'nowrap' }}
                >
                  AgriConnect
                </Typography>
              </RouterLink>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            {/* Desktop links - only on desktop */}
            {!isMobile && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                {mainMenuItems.filter(item => !item.auth || isAuthenticated).map((item) => (
                  <Button
                    key={item.text}
                    color="inherit"
                    component={RouterLink}
                    to={item.path}
                    startIcon={item.icon}
                    aria-label={item.text}
                    sx={{
                      px: 1.2,
                      py: 0.7,
                      borderRadius: 2,
                      fontWeight: 500,
                      fontSize: '0.98rem',
                      letterSpacing: 0.2,
                      backgroundColor: isActive(item.path)
                        ? "rgba(255,255,255,0.16)"
                        : "transparent",
                      borderBottom: isActive(item.path)
                        ? '2px solid #fff'
                        : '2px solid transparent',
                      transition: 'all 0.16s',
                      minWidth: 0,
                      '&:hover': {
                        backgroundColor: "rgba(255,255,255,0.22)",
                        borderBottom: '2px solid #fff',
                      },
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
                <Box sx={{ ml: 1.5 }}><LanguageSwitcher /></Box>
                {/* User menu for authenticated users */}
                {isAuthenticated ? (
                  <>
                    <Tooltip title="Account settings">
                      <IconButton
                        onClick={handleMenuOpen}
                        color="inherit"
                        aria-label="Open account menu"
                        sx={{ ml: 2, border: "2px solid rgba(255,255,255,0.5)", p: 0.5 }}
                      >
                        <Avatar sx={{ width: 36, height: 36 }} />
                      </IconButton>
                    </Tooltip>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                      PaperProps={{ sx: { minWidth: 180 } }}
                    >
                      <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose}>Profile</MenuItem>
                      <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    component={RouterLink}
                    to="/login"
                    startIcon={<Login />}
                    aria-label="Login"
                    sx={{
                      ml: 2,
                      borderRadius: 2,
                      fontWeight: 600,
                      px: 3,
                      py: 1.2,
                      fontSize: '1rem',
                      boxShadow: '0 2px 10px 0 rgba(46,125,50,0.10)',
                      letterSpacing: 0.5,
                      textTransform: 'none',
                      background: 'linear-gradient(90deg, #388E3C 0%, #2E7D32 100%)',
                      color: '#fff',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #2E7D32 0%, #388E3C 100%)',
                        color: '#fff',
                        boxShadow: '0 4px 16px 0 rgba(46,125,50,0.18)',
                      },
                    }}
                  >
                    Login
                  </Button>
                )}
              </Box>
            )}
            {/* Mobile menu button - only on mobile */}
            {isMobile && (
              <IconButton
                color="inherit"
                edge="end"
                aria-label="Open mobile menu"
                onClick={handleMobileMenuToggle}
                sx={{ ml: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      </Slide>
      <Toolbar /> {/* Spacer for fixed AppBar */}
      {/* Only render the mobile drawer on mobile screens */}
      {isMobile && renderMobileMenu()}
    </>
  );
};

export default Navbar;

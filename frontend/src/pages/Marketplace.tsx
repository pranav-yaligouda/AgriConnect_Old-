import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Chip,
  Rating,
  TextField,
  InputAdornment,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  IconButton,
  Select,
  MenuItem,
  Paper,
  Pagination,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
  Stack,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import ImageWithFallback from '../components/ImageWithFallback';
import {
  Search,
  FilterList,
  LocationOn,
  Close,
  GrassOutlined,
  Store,
  StarRate,
  Sort,
  CalendarToday,
  Category,
} from "@mui/icons-material";
import {
  containerPadding,
  cardStyle,
  paperStyle,
  formElementStyles,
  gridSpacing,
  typographyStyles,
} from "../utils/styleUtils";
import { fetchProducts, fetchCategories } from "../services/apiService";
// Removed incorrect import. Use apiService and axiosConfig for all API calls.
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import type { Product } from '../services/apiService';

import { useTranslation } from "react-i18next";

const Marketplace = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = isTablet ? 6 : 12;
  const { t } = useTranslation('marketplace');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // React Query for categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000
  });
  const categories: string[] = categoriesData || [];

  // React Query for products
  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
    error: productsError
  } = useQuery<{ products: Product[]; total: number; page: number; pageCount: number }>({
    queryKey: [
      'products',
      debouncedSearchQuery,
      selectedCategories.join(','),
      selectedDistrict,
      organicOnly, // still in key for cache separation
      sortBy,
      currentPage,
      productsPerPage,
    ],
    queryFn: () => fetchProducts({
          search: debouncedSearchQuery,
      category: selectedCategories.includes('all') || selectedCategories.length === 0
            ? undefined
        : selectedCategories.join(','),
          district: selectedDistrict,
      // Only send isOrganic if organicOnly is true
      ...(organicOnly ? { isOrganic: true } : {}),
          sort: sortBy,
          page: currentPage,
      limit: productsPerPage,
    }),
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });
  // Debug: log the productsData to verify API response
  useEffect(() => {
    console.log('productsData', productsData);
  }, [productsData]);
  const products: Product[] = productsData?.products || [];
  const totalProducts: number = productsData?.total || 0;
  const pageCount: number = productsData?.pageCount || 1;

  // Unique districts from products
  const uniqueDistricts: string[] = Array.from(
    new Set((products || []).map((product: Product) => product.location?.district).filter((district: string | undefined): district is string => district !== undefined))
  ).sort();

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) => {
      if (category === "all") {
        return ["all"];
      }
      if (prev.includes(category)) {
        return prev.filter((cat) => cat !== category);
      }
      const newCategories = [...prev.filter((cat) => cat !== "all"), category];
      return newCategories;
    });
  };

  const toggleFilterDrawer = (open: boolean) => {
    setIsFilterDrawerOpen(open);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSortBy(event.target.value as string);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Function to capitalize first letter
  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  if (productsLoading || categoriesLoading) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          py: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress size={60} />
      </Container>
    );
  }

  if (productsError || categoriesError) {
    const errorMsg = typeof productsError === 'string' ? productsError : (productsError instanceof Error ? productsError.message : '') ||
      (typeof categoriesError === 'string' ? categoriesError : (categoriesError instanceof Error ? categoriesError.message : '')) || 'Unknown error';
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          {errorMsg}
        </Typography>
      </Container>
    );
  }

  const desktopFilterSection = (
    <Box sx={{ display: { xs: "none", md: "block" }, width: "100%", mb: 2 }}>
      <Paper
        sx={{
          ...paperStyle,
          mb: 2,
          p: 2,
          borderRadius: 4,
          boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Search Field */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder={t('searchPlaceholder')}
              variant="outlined"
              size="medium"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  "&:hover": { bgcolor: "grey.50" },
                },
              }}
            />
          </Grid>

          {/* Sort Select */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium">
              <InputLabel>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Sort fontSize="small" /> {t('sortBy')}
                </Stack>
              </InputLabel>
              <Select
                value={sortBy}
                label={t('sortBy')}
                onChange={handleSortChange as any}
                sx={{
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  "&:hover": { bgcolor: "grey.50" },
                }}
              >
                <MenuItem value="featured">{t('featured')}</MenuItem>
                <MenuItem value="price-asc">{t('priceLowToHigh')}</MenuItem>
                <MenuItem value="price-desc">{t('priceHighToLow')}</MenuItem>
                <MenuItem value="newest">{t('newest')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Categories Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="medium">
              <InputLabel>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Category fontSize="small" /> {t('category')}
                </Stack>
              </InputLabel>
              <Select
                multiple
                value={selectedCategories}
                onChange={(e) =>
                  setSelectedCategories(e.target.value as string[])
                }
                label={t('category')}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(selected as string[]).map((value: string) => (
                      <Chip
                        key={value}
                        label={capitalize(value)}
                        size="small"
                        sx={{ borderRadius: 2 }}
                      />
                    ))}
                  </Box>
                )}
                sx={{
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  "&:hover": { bgcolor: "grey.50" },
                }}
              >
                {(categories || []).map((category: string) => (
                  <MenuItem key={category} value={category}>
                    <Checkbox checked={selectedCategories.includes(category)} />
                    <ListItemText primary={capitalize(category)} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Location Filter */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium">
              <InputLabel>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <LocationOn fontSize="small" /> {t('district')}
                </Stack>
              </InputLabel>
              <Select
                value={selectedDistrict}
                label={t('district')}
                onChange={(e) => setSelectedDistrict(e.target.value as string)}
                sx={{
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  "&:hover": { bgcolor: "grey.50" },
                }}
              >
                <MenuItem value="">
                  <em>{t('allDistricts')}</em>
                </MenuItem>
                {(uniqueDistricts || []).map((district) => (
                  <MenuItem key={district} value={district}>
                    {capitalize(district)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Organic Filter */}
          <Grid item xs={12} md={1}>
            <Tooltip title={t('showOnlyOrganic')}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={organicOnly}
                    onChange={(e) => setOrganicOnly(e.target.checked)}
                    color="primary"
                    icon={<GrassOutlined />}
                    checkedIcon={<GrassOutlined />}
                  />
                }
                label=""
                sx={{
                  m: 0,
                  "& .MuiButtonBase-root": { p: 1 },
                  "&:hover": {
                    bgcolor: "grey.50",
                    borderRadius: 2,
                  },
                }}
              />
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ ...containerPadding }}>
      {/* Hero Section */}
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          {t('hero.title')}
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 800, mx: "auto" }}
        >
          {t('hero.tagline')}
        </Typography>
        <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 2, mb: 1 }}>
          <Chip label={t('hero.chip1')} color="primary" variant="outlined" />
          <Chip label={t('hero.chip2')} color="primary" variant="outlined" />
          <Chip label={t('hero.chip3')} color="primary" variant="outlined" />
          
        </Stack>
      </Box>
      {/* Mobile Filter Button */}
      {isMobile && (
        <Box sx={{ mb: 2, px: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<FilterList />}
            onClick={() => toggleFilterDrawer(true)}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: "1rem",
            }}
          >
            {t('filterProducts')}
          </Button>
        </Box>
      )}

      {desktopFilterSection}

      <Grid container spacing={gridSpacing}>
        {/* Product Grid */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="body1"
                color="text.secondary"
                fontWeight="medium"
              >
                {totalProducts} {t('productsAvailable')}
              </Typography>
            </Box>

            {/* Selected filters display */}
            {((selectedCategories || []).length > 0 || organicOnly || searchQuery) && (
              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}
              >
                {(selectedCategories || []).map((category) => (
                  <Chip
                    key={category}
                    label={capitalize(category)}
                    onDelete={() => handleCategoryChange(category)}
                    size="medium"
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                ))}
                {organicOnly && (
                  <Chip
                    label={t('organic')}
                    onDelete={() => setOrganicOnly(false)}
                    size="medium"
                    color="secondary"
                    icon={<GrassOutlined />}
                    sx={{ borderRadius: 2 }}
                  />
                )}
                {searchQuery && (
                  <Chip
                    label={`"${searchQuery}"`}
                    onDelete={() => setSearchQuery("")}
                    size="medium"
                    color="default"
                    sx={{ borderRadius: 2 }}
                  />
                )}
                {selectedDistrict && (
                  <Chip
                    label={`District: ${capitalize(selectedDistrict)}`}
                    onDelete={() => setSelectedDistrict("")}
                    size="medium"
                    color="default"
                    sx={{ borderRadius: 2 }}
                  />
                )}
              </Stack>
            )}
          </Box>

          {(products && products.length > 0) ? (
            <Grid container spacing={2}>
              {(products || []).map((product) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  xl={3}
                  key={product._id}
                >
                  <Card
                    sx={{
                      ...cardStyle,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      minHeight: "500px",
                      position: "relative",
                    }}
                  >
                    {/* Badges */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: 16,
                        top: 16,
                        zIndex: 1,
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      {product.isOrganic && (
                        <Chip
                          label={t('organic')}
                          size="small"
                          color="secondary"
                          icon={<GrassOutlined />}
                          sx={{
                            fontWeight: "bold",
                            borderRadius: "16px",
                          }}
                        />
                      )}

                      {new Date(product.harvestDate) >
                        new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
                        <Chip
                          label={t('fresh')}
                          size="small"
                          color="success"
                          sx={{
                            fontWeight: "bold",
                            borderRadius: "16px",
                          }}
                        />
                      )}
                    </Box>

                    {/* Product Image */}
                    <Box
                      sx={{
                        position: "relative",
                        height: "200px",
                        width: "100%",
                      }}
                    >
                      <ImageWithFallback
                        src={product.images[0] || '/product-placeholder.jpg'}
                        fallbackSrc="/product-placeholder.jpg"
                        alt={product.name}
                        style={{ objectFit: 'cover', height: '100%', width: '100%', borderRadius: 2 }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: "60px",
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                        }}
                      />
                      <Box sx={{ position: "absolute", bottom: 10, right: 10 }}>
                        <Chip
                          label={`₹${product.price}/${product.unit}`}
                          sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            borderRadius: "16px",
                          }}
                        />
                      </Box>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, pt: 2, pb: 1, px: 2 }}>
                      {/* Product title */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h6"
                          component="h3"
                          sx={{
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                            lineHeight: 1.2,
                            ...typographyStyles.ellipsis,
                            height: "24px",
                          }}
                        >
                          {product.name}
                        </Typography>
                      </Box>

                      {/* Short description */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1,
                          ...typographyStyles.ellipsis,
                          height: "40px",
                        }}
                      >
                        {product.description}
                      </Typography>

                      {/* Farmer info */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Store
                          fontSize="small"
                          color="primary"
                          sx={{ mr: 0.5 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "medium" }}
                        >
                          {product.farmer?.name || t('unknownFarmer')}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <LocationOn
                          fontSize="small"
                          color="action"
                          sx={{ mr: 0.5 }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {product.location
                            ? `${product.location.district}, ${product.location.state}`
                            : t('locationNotSpecified')}
                        </Typography>
                      </Box>

                      {/* Stock */}
                      <Box sx={{ mb: 0.5 }}>
                        <Typography
                          variant="body2"
                          color={
                            product.availableQuantity > 20
                              ? "success.main"
                              : product.availableQuantity > 5
                              ? "warning.main"
                              : "error.main"
                          }
                        >
                          {product.availableQuantity > 20
                            ? t('inStock')
                            : product.availableQuantity > 5
                            ? t('limitedStock')
                            : t('almostSoldOut')}
                        </Typography>
                      </Box>
                    </CardContent>

                    <CardActions
                      sx={{
                        px: 2,
                        pb: 2,
                        pt: 0,
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Button
                        component={Link}
                        to={`/products/${product._id}`}
                        variant="contained"
                        size="small"
                        sx={{
                          borderRadius: "20px",
                          fontWeight: "medium",
                          width: "100%",
                        }}
                      >
                        {t('viewProductDetails')}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 6, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                {t('noProductsFound')}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {t('tryAdjustingSearch')}
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2, borderRadius: 2, py: 1, px: 3 }}
                onClick={() => {
                  setSelectedCategories([]);
                  setOrganicOnly(false);
                  setSearchQuery("");
                  setSelectedDistrict("");
                }}
              >
                {t('viewAllProducts')}
              </Button>
            </Paper>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 1 }}
            >
              <Pagination
                count={pageCount}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
                siblingCount={isMobile ? 0 : 1}
                boundaryCount={0}
                shape="rounded"
                size={isMobile ? "medium" : "large"}
              />
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={isFilterDrawerOpen}
        onClose={() => toggleFilterDrawer(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: "85vw",
            maxWidth: 320,
            boxSizing: "border-box",
            "& .MuiFormControlLabel-root": {
              alignItems: "flex-start",
            },
          },
        }}
      >
        <Box sx={{ p: 2, height: "100%", overflowY: "auto" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              {t('filters')}
            </Typography>
            <IconButton onClick={() => toggleFilterDrawer(false)}>
              <Close />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ "& .MuiInputBase-root": { fontSize: "0.9rem" } }}>
            {/* Categories Section */}
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              {t('categories')}
            </Typography>
            <FormGroup sx={{ mb: 3 }}>
              {categories.map((category) => (
                <FormControlLabel
                  key={category}
                  control={
                    <Checkbox
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      size="small"
                      sx={{ py: 0.5 }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                      {capitalize(category)}
                    </Typography>
                  }
                  sx={{
                    mx: 0,
                    py: 0.5,
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                />
              ))}
            </FormGroup>

            <Divider sx={{ my: 2 }} />

            {/* Location Section */}
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              {t('location')}
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
              <InputLabel sx={{ fontSize: "0.9rem" }}>
                {t('selectDistrict')}
              </InputLabel>
              <Select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value as string)}
                sx={{ fontSize: "0.9rem" }}
              >
                <MenuItem value="">
                  <em>{t('allDistricts')}</em>
                </MenuItem>
                {uniqueDistricts.map((district) => (
                  <MenuItem key={district} value={district}>
                    {capitalize(district)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            {/* Organic Filter */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={organicOnly}
                  onChange={(e) => setOrganicOnly(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                  {t('showOnlyOrganic')}
                </Typography>
              }
              sx={{ mx: 0 }}
            />

            <Divider sx={{ my: 3 }} />

            {/* Reset Button */}
            <Button
              fullWidth
              variant="outlined"
              size="medium"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontSize: "0.9rem",
                py: 1,
              }}
              onClick={() => {
                setSelectedCategories([]);
                setOrganicOnly(false);
                setSearchQuery("");
                setSelectedDistrict("");
              }}
            >
              {t('clearAllFilters')}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  );
};

export default Marketplace;

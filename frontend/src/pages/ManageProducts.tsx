import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  useTheme,
  useMediaQuery,
  Slide,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import {
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  CalendarToday,
  Refresh,
} from "@mui/icons-material";
import ImageUpload from '../components/dashboard/ImageUpload';
import api from "../utils/axiosConfig";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { containerPadding } from "../utils/styleUtils";

import { useTranslation } from "react-i18next";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  availableQuantity: number;
  minimumOrderQuantity?: number | null;
  isOrganic: boolean;
  harvestDate: string;
  images: string[];
  location: {
    district: string;
    state: string;
  };
  isAvailable: boolean;
  createdAt: string;
}

const ManageProducts = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await api.get("/products/farmer/my-products");

      setProducts(response.data as Product[]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
      toast.error("Failed to load products");
      setLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (productId: string) => {
    setSelectedProductId(productId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProductId) return;
  
    try {
      await api.delete(`/products/${selectedProductId}`);
  
      setProducts(products.filter((p) => p._id !== selectedProductId));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedProductId(null);
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    try {
      // Only send fields expected by backend, with correct types
      // Deeply omit all fields not allowed by backend Joi schema
      const productPayload = {
        name: selectedProduct.name,
        description: selectedProduct.description,
        price: Number(selectedProduct.price),
        category: selectedProduct.category,
        availableQuantity: Number(selectedProduct.availableQuantity),
        ...(typeof selectedProduct.minimumOrderQuantity === 'number' && !isNaN(selectedProduct.minimumOrderQuantity)
          ? { minimumOrderQuantity: selectedProduct.minimumOrderQuantity }
          : (typeof selectedProduct.minimumOrderQuantity === 'string' &&
              selectedProduct.minimumOrderQuantity !== undefined &&
              selectedProduct.minimumOrderQuantity !== null &&
              (selectedProduct.minimumOrderQuantity as string).trim() !== '' &&
              !isNaN(Number(selectedProduct.minimumOrderQuantity)))
            ? { minimumOrderQuantity: Number(selectedProduct.minimumOrderQuantity) }
            : {}),
        unit: selectedProduct.unit,
        images: (selectedProduct.images || []).map(String),
        isOrganic: Boolean(selectedProduct.isOrganic),
        harvestDate: selectedProduct.harvestDate, // ISO string is fine for Joi
        location: {
          district: selectedProduct.location.district,
          state: selectedProduct.location.state,
        }
      };

      const response = await api.patch(`/products/${selectedProduct._id}`, productPayload);
      setProducts(products.map(p => p._id === selectedProduct._id ? response.data as Product : p));
      setEditDialogOpen(false);
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={containerPadding}>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={isMobile ? 'sm' : 'lg'} sx={containerPadding}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1">
          {t('manageProducts.manageProducts')}
        </Typography>
        {/* Add Product button removed */}
      </Box>

      {isMobile ? (
        <Box>
          {products.length === 0 ? (
            <Typography align="center" color="textSecondary" sx={{ mt: 4 }}>
              {t('manageProducts.noProducts') || 'No products found.'}
            </Typography>
          ) : (
            <Box>
              {products.map((product, idx) => (
                <Slide key={product._id} direction="up" in mountOnEnter unmountOnExit timeout={400 + idx * 50}>
                  <Paper
                    elevation={4}
                    sx={{
                      mb: 3,
                      borderRadius: 4,
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      background: `linear-gradient(120deg, ${theme.palette.background.paper} 85%, ${theme.palette.primary.light} 100%)`,
                      boxShadow: theme.shadows[6],
                      position: 'relative',
                      transition: 'box-shadow 0.3s',
                      '&:hover': { boxShadow: theme.shadows[12] },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={product.images[0] || "/product-placeholder.jpg"}
                        variant="rounded"
                        sx={{ width: 72, height: 72, mr: 2, border: `2px solid ${theme.palette.primary.main}` }}
                        alt={product.name}
                      />
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: 0.2 }}>
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {product.location.district}, {product.location.state}
                        </Typography>
                        {product.isOrganic && (
                          <Chip
                            label={t('manageProducts.organic')}
                            size="small"
                            color="success"
                            sx={{ mt: 0.5, fontWeight: 600 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <IconButton aria-label="edit" color="primary" size="large" onClick={() => handleEditClick(product)} sx={{ mb: 0.5 }}>
                          <Edit fontSize="medium" />
                        </IconButton>
                        <IconButton aria-label="delete" color="error" size="large" onClick={() => handleDeleteClick(product._id)}>
                          <Delete fontSize="medium" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-start' }}>
                      <Chip label={`${t('manageProducts.category')}: ${product.category}`} color="primary" sx={{ fontWeight: 500 }} />
                      <Chip label={`${t('manageProducts.price')}: ₹${product.price}/${product.unit}`} sx={{ fontWeight: 500 }} />
                      <Chip label={`${t('manageProducts.availableQuantity')}: ${product.availableQuantity} ${product.unit}`} sx={{ fontWeight: 500 }} />
                      <Chip label={`${t('manageProducts.status')}: ${product.isAvailable ? t('manageProducts.active') : t('manageProducts.inactive')}`} color={product.isAvailable ? 'success' : 'error'} sx={{ fontWeight: 500 }} />
                      <Chip label={`${t('manageProducts.harvestDate')}: ${new Date(product.harvestDate).toLocaleDateString()}`} icon={<CalendarToday fontSize="small" />} sx={{ fontWeight: 500 }} />
                      <Chip label={`${t('manageProducts.minimumOrderQuantity')}: ${product.minimumOrderQuantity ?? t('manageProducts.notSet')}`} sx={{ fontWeight: 500 }} />
                    </Box>
                  </Paper>
                </Slide>
              ))}
            </Box>
          )}
        </Box>
      ) : (
        <>
          <Paper
            sx={{
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[8],
              borderRadius: 4,
              overflowX: 'auto',
              transition: 'box-shadow 0.3s',
              mt: 2,
            }}
          >
            <TableContainer sx={{ maxHeight: '70vh', borderRadius: 4 }}>
              <Table stickyHeader>
                <TableHead
                  sx={{
                    backgroundColor: theme.palette.primary.light,
                    "& th": {
                      color: theme.palette.primary.contrastText,
                      fontWeight: "bold",
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      background: theme.palette.primary.light,
                      borderBottom: `2px solid ${theme.palette.primary.main}`,
                    },
                  }}
                >
                  <TableRow>
                    <TableCell>{t('manageProducts.product')}</TableCell>
                    <TableCell>{t('manageProducts.category')}</TableCell>
                    <TableCell align="right">{t('manageProducts.price')}</TableCell>
                    <TableCell align="center">{t('manageProducts.stock')}</TableCell>
                    <TableCell>{t('manageProducts.status')}</TableCell>
                    <TableCell>{t('manageProducts.harvestDate')}</TableCell>
                    <TableCell>{t('manageProducts.minimumOrderQuantity')}</TableCell>
                    <TableCell>{t('manageProducts.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product, idx) => (
                    <TableRow
                      key={product._id}
                      hover
                      sx={{
                        backgroundColor: idx % 2 === 0 ? theme.palette.action.hover : 'inherit',
                        transition: 'background 0.2s',
                        '&:hover': { backgroundColor: theme.palette.action.selected },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar
                            src={product.images[0] || "/product-placeholder.jpg"}
                            variant="rounded"
                            sx={{ width: 56, height: 56 }}
                          />
                          <Box>
                            <Typography variant="body1" fontWeight="500">
                              {product.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {product.location.district}, {product.location.state}
                            </Typography>
                            {product.isOrganic && (
                              <Chip
                                label={t('manageProducts.organic')}
                                size="small"
                                color="success"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.category}
                          color="primary"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="primary" fontWeight="500">
                          ₹{product.price}/{product.unit}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(
                              (product.availableQuantity / 100) * 100,
                              100
                            )}
                            sx={{
                              flexGrow: 1,
                              height: 8,
                              borderRadius: 4,
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 4,
                                backgroundColor:
                                  product.availableQuantity > 20
                                    ? theme.palette.success.main
                                    : theme.palette.warning.main,
                              },
                            }}
                          />
                          <Typography>
                            {product.availableQuantity} {product.unit}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.isAvailable ? t('manageProducts.active') : t('manageProducts.inactive')}
                          color={product.isAvailable ? "success" : "error"}
                          icon={product.isAvailable ? <CheckCircle /> : <Cancel />}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={new Date(product.harvestDate).toLocaleDateString()}
                          icon={<CalendarToday fontSize="small" />}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {product.minimumOrderQuantity !== null && product.minimumOrderQuantity !== undefined ? (
                          <Typography>
                            {product.minimumOrderQuantity} {product.unit}
                          </Typography>
                        ) : (
                          <Typography>
                            {t('manageProducts.notSet')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEditClick(product)}
                          color="primary"
                          aria-label={t('manageProducts.edit')}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteClick(product._id)}
                          color="error"
                          aria-label={t('manageProducts.delete')}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Delete Product Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('manageProducts.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {t('manageProducts.confirmDeleteMessage')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="primary"
            variant="outlined"
          >
            {t('manageProducts.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            startIcon={<Delete />}
          >
            {t('manageProducts.confirmDelete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('manageProducts.editProduct')}</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('manageProducts.productName')}
                    fullWidth
                    value={selectedProduct.name}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        name: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('manageProducts.category')}</InputLabel>
                    <Select
                      value={selectedProduct.category}
                      onChange={(e) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          category: e.target.value,
                        })
                      }
                      label={t('manageProducts.category')}
                    >
                      <MenuItem value="vegetables">{t('manageProducts.vegetables')}</MenuItem>
                      <MenuItem value="fruits">{t('manageProducts.fruits')}</MenuItem>
                      <MenuItem value="grains">{t('manageProducts.grains')}</MenuItem>
                      <MenuItem value="dairy">{t('manageProducts.dairy')}</MenuItem>
                      <MenuItem value="meat">{t('manageProducts.meat')}</MenuItem>
                      <MenuItem value="poultry">{t('manageProducts.poultry')}</MenuItem>
                      <MenuItem value="other">{t('manageProducts.other')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('manageProducts.price')}
                    type="number"
                    fullWidth
                    value={selectedProduct.price}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        price: Number(e.target.value),
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('manageProducts.unit')}</InputLabel>
                    <Select
                      value={selectedProduct.unit}
                      onChange={(e) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          unit: e.target.value,
                        })
                      }
                      label={t('manageProducts.unit')}
                    >
                      <MenuItem value="kg">{t('manageProducts.kg')}</MenuItem>
                      <MenuItem value="g">{t('manageProducts.g')}</MenuItem>
                      <MenuItem value="lb">{t('manageProducts.lb')}</MenuItem>
                      <MenuItem value="piece">{t('manageProducts.piece')}</MenuItem>
                      <MenuItem value="dozen">{t('manageProducts.dozen')}</MenuItem>
                      <MenuItem value="bunch">{t('manageProducts.bunch')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('manageProducts.availableQuantity')}
                    type="number"
                    fullWidth
                    required
                    value={selectedProduct.availableQuantity}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        availableQuantity: Number(e.target.value),
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('manageProducts.minimumOrderQuantity')}
                    type="number"
                    fullWidth
                    value={selectedProduct.minimumOrderQuantity ?? ''}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        minimumOrderQuantity: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    helperText={t('manageProducts.minimumOrderQuantityHelper')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('manageProducts.harvestDate')}
                    type="date"
                    fullWidth
                    value={
                      new Date(selectedProduct.harvestDate)
                        .toISOString()
                        .split("T")[0]
                    }
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        harvestDate: e.target.value,
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('manageProducts.description')}
                    multiline
                    rows={4}
                    fullWidth
                    value={selectedProduct.description}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        description: e.target.value,
                      })
                    }
                  />
                </Grid>
              </Grid>
              {/* Product Status Switch */}
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedProduct.isAvailable}
                      onChange={(e) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          isAvailable: e.target.checked,
                        })
                      }
                      color="success"
                    />
                  }
                  label={selectedProduct.isAvailable ? t('manageProducts.active') : t('manageProducts.inactive')}
                />
              </Grid>
              {/* Product Images */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('manageProducts.productImages')}
                </Typography>
                <ImageUpload
                  images={selectedProduct.images}
                  onImagesChange={(imgs) => setSelectedProduct({ ...selectedProduct, images: imgs })}
                  uploading={uploading}
                />
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialogOpen(false)}
            color="primary"
            variant="outlined"
          >
            {t('manageProducts.cancel')}
          </Button>
          <Button
            onClick={handleUpdateProduct}
            color="primary"
            variant="contained"
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {uploading ? t('manageProducts.saving') || 'Saving...' : t('manageProducts.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageProducts;

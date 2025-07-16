import React, { useState, useEffect } from "react";
import { Container, CircularProgress, Alert, Button, useMediaQuery, Box, Card, CardContent, Typography, Chip, Avatar, LinearProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, addProduct, deleteProduct, uploadProductImages, fetchProductNames } from "../services/apiService";
import type { Product, PaginatedProducts, ProductNameOption } from '../types/api';
import ErrorBoundary from '../components/ErrorBoundary';
import { useNotification } from '../contexts/NotificationContext';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import QuickActions from '../components/dashboard/QuickActions';
import ProductTable from '../components/dashboard/ProductTable';
import ProductGrid from '../components/dashboard/ProductGrid';
import OrderTable from '../components/dashboard/OrderTable';
import AddProductDialog from '../components/dashboard/AddProductDialog';
import DeleteProductDialog from '../components/dashboard/DeleteProductDialog';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// Form state type for new product creation
// (kept here for state, but type is shared with AddProductDialog)
type NewProductForm = {
  name: string;
  description: string;
  price: string;
  category: '' | Product['category'];
  availableQuantity: string;
  minimumOrderQuantity?: string;
  unit: '' | Product['unit'];
  images: string[];
  harvestDate: string;
  isOrganic: boolean;
  location: {
    district: string;
    state: string;
  };
  stock?: string;
};

const Dashboard: React.FC = () => {
  const auth = useAuth();
  const user = auth?.user;
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery('(max-width:600px)');

  // Dialog and form state
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [productImageError, setProductImageError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    unit: '',
    images: [],
    harvestDate: new Date().toISOString().split('T')[0],
    isOrganic: false,
    location: { district: '', state: '' },
    availableQuantity: '',
  });

  // Track if component is mounted to avoid state updates after unmount
  const isMountedRef = React.useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // React Query: Fetch products
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorObj
  } = useQuery<PaginatedProducts, Error>({
    queryKey: ['products', retryCount],
    queryFn: fetchProducts,
    staleTime: 60 * 1000,
  });
  const products: Product[] = productsData?.products ?? [];

  // React Query: Fetch product names by category and language
  const {
    data: productNames = [],
  } = useQuery<ProductNameOption[]>({
    queryKey: ['productNames', newProduct.category, i18n.language],
    queryFn: () => newProduct.category ? fetchProductNames(newProduct.category) : Promise.resolve([]),
    enabled: !!newProduct.category,
    staleTime: 10 * 60 * 1000,
  });

  // React Query: Add product mutation
  const addProductMutation = useMutation<any, Error, any>({
    mutationFn: async (productData: any) => {
      // Build FormData for product creation
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('description', productData.description);
      formData.append('price', productData.price.toString());
      formData.append('category', productData.category);
      formData.append('availableQuantity', productData.availableQuantity.toString());
      if (productData.minimumOrderQuantity) formData.append('minimumOrderQuantity', productData.minimumOrderQuantity.toString());
      formData.append('unit', productData.unit);
      formData.append('harvestDate', productData.harvestDate);
      formData.append('isOrganic', productData.isOrganic ? 'true' : 'false');
      formData.append('location', JSON.stringify({
        district: productData.location.district,
        state: productData.location.state
      }));
      // Attach up to 3 image files as 'images'
      productImageFiles.slice(0, 3).forEach(file => formData.append('images', file));
      // Send FormData to backend
      const createdProduct = await addProduct(formData);
      return createdProduct;
    },
    onSuccess: () => {
      if (!isMountedRef.current) return;
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpenProductDialog(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        unit: '',
        images: [],
        harvestDate: new Date().toISOString().split('T')[0],
    isOrganic: false,
        location: { district: '', state: '' },
        availableQuantity: '',
      });
      setProductImageFiles([]);
      setProductImagePreviews([]);
      setProductImageError(null);
      notify(t('dashboard.productAddedSuccess'), 'success');
    },
    onError: (err: any) => {
      if (!isMountedRef.current) return;
      let msg = 'Unknown error';
      if (typeof err === 'string') msg = err;
      else if (err?.message) msg = err.message;
      else if (err?.error && typeof err.error === 'string') msg = err.error;
      setProductImageError(msg);
      notify(msg, 'error');
    },
  });

  // React Query: Delete product mutation
  const deleteProductMutation = useMutation<void, Error, string>({
    mutationFn: async (productId: string) => {
      await deleteProduct(productId);
            return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpenDeleteDialog(false);
      setSelectedProduct(null);
      notify({ type: 'success', message: t('dashboard.productDeletedSuccess') });
    },
    onError: (err: any) => {
      notify({ type: 'error', message: err.message || t('dashboard.productDeleteError') });
    },
  });

  // Redirect to login if not logged in
  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Handlers
  const handleAddProduct = () => {
    // Validation (can be improved)
      const missingFields = [];
      if (!newProduct.name) missingFields.push(t('dashboard.productName'));
      if (!newProduct.description) missingFields.push(t('dashboard.description'));
      if (!newProduct.price) missingFields.push(t('dashboard.price'));
      if (!newProduct.category) missingFields.push(t('dashboard.category'));
      if (!newProduct.availableQuantity) missingFields.push(t('dashboard.availableQuantity'));
      if (!newProduct.unit) missingFields.push(t('dashboard.unit'));
      if (!newProduct.location.district) missingFields.push(t('dashboard.district'));
      if (!newProduct.location.state) missingFields.push(t('dashboard.state'));
      if (productImageFiles.length === 0) missingFields.push(t('dashboard.images'));
      if (missingFields.length > 0) {
      setProductImageError(t('dashboard.missingFields', { fields: missingFields.join(', ') }));
      notify({ type: 'error', message: t('dashboard.missingFields', { fields: missingFields.join(', ') }) });
        return;
      }
      setProductImageError(null);
    addProductMutation.mutate({
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
      category: newProduct.category as Product['category'],
        availableQuantity: parseFloat(newProduct.availableQuantity),
        minimumOrderQuantity: newProduct.minimumOrderQuantity,
      unit: newProduct.unit as Product['unit'],
        harvestDate: newProduct.harvestDate,
        isOrganic: newProduct.isOrganic,
        location: {
          district: newProduct.location.district,
          state: newProduct.location.state,
        },
    });
  };

  // Role-based dashboard content
  const renderRoleDashboard = () => {
    if (!user) return null;
    if (user.role === 'farmer') {
      // Enhanced mobile UI for recently uploaded products
    return (
        <>
          <QuickActions
            role={user.role}
            onAddProduct={() => setOpenProductDialog(true)}
            onManageProducts={() => navigate('/my-products')}
            onBrowseProducts={() => {}}
            onBulkOrders={() => {}}
            onViewProfile={() => {}}
          />
          {isMobile ? (
            <Box sx={{ overflowX: 'auto', pb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {products.slice(0, 5).map((product) => (
                  <Card key={product._id} sx={{ minWidth: 260, maxWidth: 320, flex: '0 0 auto', boxShadow: 3, borderRadius: 3, position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      {product.isOrganic && <Chip label={t('dashboard.organic')} color="success" size="small" />}
          </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 2 }}>
                          <Avatar
                            src={product.images[0] || '/product-placeholder.jpg'}
                            variant="rounded"
                        sx={{ width: 64, height: 64, boxShadow: 2, backgroundColor: 'grey.200' }}
                        slotProps={{
                          img: {
                            onError: (e: any) => {
                                e.currentTarget.src = '/product-placeholder.jpg';
                            }
                              }
                            }}
                          >
                        <InventoryIcon fontSize="large" />
                          </Avatar>
                          </Box>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={700} noWrap>{product.name}</Typography>
                      <Chip label={product.category} color="primary" size="small" sx={{ textTransform: 'capitalize', mt: 1 }} />
                      <Typography variant="body2" color="primary" fontWeight={500} sx={{ mt: 1 }}>
                          ₹{product.price}/{product.unit}
                        </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={1}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((product.availableQuantity / 100) * 100, 100)}
                          sx={{ height: 8, borderRadius: 4, flex: 1, backgroundColor: 'grey.200', '& .MuiLinearProgress-bar': { borderRadius: 4, backgroundColor: product.availableQuantity > 20 ? 'success.main' : 'warning.main' } }}
                        />
                          <Typography variant="caption">
                            {product.availableQuantity} {product.unit}
                          </Typography>
                        </Box>
                        <Chip
                          label={new Date(product.harvestDate).toLocaleDateString()}
                          variant="outlined"
                          color="secondary"
                          icon={<CalendarTodayIcon fontSize="small" sx={{ color: 'inherit' }} />}
                        sx={{ fontSize: '0.85rem', mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          ) : (
            <ProductTable
              products={products.slice(0, 5)}
              onRowClick={() => navigate('/my-products')}
            />
          )}
        </>
      );
    }
    if (user.role === 'vendor') {
      return (
        <>
          <QuickActions
            role={user.role}
            onAddProduct={() => {}}
            onManageProducts={() => {}}
            onBrowseProducts={() => navigate('/marketplace')}
            onBulkOrders={() => navigate('/bulk-orders')}
            onViewProfile={() => {}}
          />
          <ProductGrid
            products={products}
            onViewDetails={(product) => navigate(`/products/${product._id}`)}
            onBulkOrder={(product) => navigate(`/bulk-order/${product._id}`)}
          />
        </>
      );
    }
    if (user.role === 'user') {
      return (
        <>
          <QuickActions
            role={user.role}
            onAddProduct={() => {}}
            onManageProducts={() => {}}
            onBrowseProducts={() => navigate('/marketplace')}
            onBulkOrders={() => {}}
            onViewProfile={() => navigate('/profile')}
          />
          <OrderTable orders={[]} />
        </>
      );
    }
    return null;
  };

  // Loading and error states
  if (productsLoading) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <span>{t('dashboard.loading')}</span>
      </Container>
    );
  }
  if (productsError) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{(typeof productsErrorObj === 'object' && productsErrorObj !== null && 'message' in productsErrorObj)
  ? (productsErrorObj as { message: string }).message
          : String(productsErrorObj) || t('dashboard.productsLoadError')}</Alert>
        <Button variant="contained" color="primary" onClick={() => setRetryCount(c => c + 1)}>{t('dashboard.retry')}</Button>
      </Container>
    );
  }
  if (!user) return null;

  // When closing AddProductDialog, always clear error state
  const handleCloseProductDialog = () => {
    setOpenProductDialog(false);
    setProductImageError(null);
  };

  return (
    <ErrorBoundary>
    <Container maxWidth="xl" sx={{ py: 4 }}>
        {user ? <DashboardHeader user={user} products={products} /> : null}
        {renderRoleDashboard()}
        <AddProductDialog
        open={openProductDialog}
          onClose={handleCloseProductDialog}
          onSubmit={handleAddProduct}
          loading={addProductMutation.status === 'pending'}
          error={productImageError ?? (addProductMutation.error && typeof addProductMutation.error === 'object' ? addProductMutation.error.message : addProductMutation.error) ?? undefined}
          productNames={productNames}
          onImagesChange={(files, previews) => { setProductImageFiles(files); setProductImagePreviews(previews); setProductImageError(null); }}
          imagePreviews={productImagePreviews}
          imageError={productImageError ?? undefined}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
        />
        <DeleteProductDialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          onConfirm={() => selectedProduct && deleteProductMutation.mutate(selectedProduct._id)}
          loading={deleteProductMutation.status === 'pending'}
        />
    </Container>
    </ErrorBoundary>
  );
};

export default Dashboard;

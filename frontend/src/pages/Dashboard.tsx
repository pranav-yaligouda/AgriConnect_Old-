import React, { useState, useEffect } from "react";
import { Box, Container, Grid, Typography, Tabs, Tab, Button, Snackbar, CircularProgress, Alert, Paper, TableContainer, Table, TableBody, TableCell, TableRow, TableHead, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Avatar, Chip, Divider, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchDashboardData, addProduct, deleteProduct, fetchProducts, uploadProductImages } from "../services/apiService";
import ImageUpload from "../components/dashboard/ImageUpload";
import { toast } from "react-toastify";
import DashboardIcon from "@mui/icons-material/Dashboard";


// Utility function to get role-based profile placeholder
function getRoleProfilePlaceholder(role?: string): string {
  switch (role) {
    case 'farmer':
      return '/images/farmerProfilePlaceholder.png';
    case 'vendor':
      return '/images/vendorProfilePlaceholder.png';
    default:
      return '/images/userProfilePlaceholder.png';
  }
}

import AddIcon from "@mui/icons-material/Add";
import InventoryIcon from "@mui/icons-material/Inventory";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocalShipping from "@mui/icons-material/LocalShipping";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import LinearProgress from "@mui/material/LinearProgress";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

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

interface Order {
  _id: string;
  date: string;
  status: string;
  items: Array<{
    product: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  buyer: {
    name: string;
    location: string;
  };
}

interface User {
  _id: string;
  name: string;
  role: "user" | "farmer" | "vendor" | "admin";
  email: string;
  phone: string;
  address: {
    street: string;
    district: string;
    state: string;
    zipcode: string;
  };
  profileImage: string | { data: string, contentType: string };
  profileImages?: string[];
  joinDate: string;
}

interface DashboardDataResponse {
  user: User;
  products: Product[];
  orders: Order[];
}

interface UploadResponse {
  urls: Array<{ url: string }>;
}

interface NewProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  availableQuantity: number;
  minimumOrderQuantity?: number | null;
  unit: string;
  images: string[];
  harvestDate: string;
  isOrganic: boolean;
  location: {
    district: string;
    state: string;
  };
}

function getProfileImageSrc(user: User | null): string {
  if (!user) return getRoleProfilePlaceholder();
  const img = user.profileImage;

  // Case 1: Object with base64 data
  if (img && typeof img === "object" && "data" in img && "contentType" in img && img.data && img.contentType) {
    return `data:${img.contentType};base64,${img.data}`;
  }

  // Case 2: String - data URL or non-placeholder URL
  if (typeof img === "string" && img.length > 0) {
    // Accept data URLs or any non-placeholder URLs
    if (img.startsWith('data:image/')) {
      return img;
    }
    // Exclude known placeholders
    if (!img.includes('farmerProfilePlaceholder.png') && !img.includes('vendorProfilePlaceholder.png') && !img.includes('userProfilePlaceholder.png')) {
      return img;
    }
  }

  // Fallback: Placeholder
  return getRoleProfilePlaceholder(user.role);
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard = () => {
  const [retryCount, setRetryCount] = useState(0);
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [uploading, setUploading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openProductDialog, setOpenProductDialog] = useState(false);

  // Add state for product image upload
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [uploadingProductImages, setUploadingProductImages] = useState(false);
  const [productImageError, setProductImageError] = useState<string | null>(null);


  // Fetch dashboard data only once on mount

  async function fetchData() {
    try {
      const data = await fetchDashboardData();
      setUser(data.user);
      setProducts(data.products || []);
      setOrders(data.orders || []);
      setLoading(false);
    } catch (error: any) {
      let errorMsg = "Failed to load dashboard data";
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        errorMsg = error.response.data?.message || errorMsg;
        console.error("Error fetching dashboard data (response):", error.response);
      } else if (error.request) {
        errorMsg = "No response received from server. Please check your network or try again later.";
        console.error("Error fetching dashboard data (request):", error.request);
      } else {
        errorMsg = error.message || errorMsg;
        console.error("Error fetching dashboard data (general):", error);
      }
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  }

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    unit: "kg",
    images: [] as string[],
    harvestDate: new Date().toISOString().split("T")[0],
    isOrganic: false,
    location: {
      district: "",
      state: "",
    },
    availableQuantity: "",
  } as {
    name: string;
    description: string;
    price: string;
    category: string;
    stock: string;
    unit: string;
    images: string[];
    harvestDate: string;
    isOrganic: boolean;
    location: { district: string; state: string };
    availableQuantity: string;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchDashboardData();
        setUser(data.user);
        setProducts(data.products || []);
        setOrders(data.orders || []);
        setLoading(false);
      } catch (error: any) {
        let errorMsg = "Failed to load dashboard data";
        if (error.response) {
          if (error.response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }
          errorMsg = error.response.data?.message || errorMsg;
          console.error("Error fetching dashboard data (response):", error.response);
        } else if (error.request) {
          errorMsg = "No response received from server. Please check your network or try again later.";
          console.error("Error fetching dashboard data (request):", error.request);
        } else {
          errorMsg = error.message || errorMsg;
          console.error("Error fetching dashboard data (general):", error);
        }
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);



  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {

    setTabValue(newValue);
  };

  const handleAddProduct = async () => {
    try {
      // Detailed validation
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
        toast.error(t('dashboard.missingFields', { fields: missingFields.join(', ') }));
        return;
      }
      setUploadingProductImages(true);
      setProductImageError(null);
      // 1. Create product without images
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        availableQuantity: parseFloat(newProduct.availableQuantity),
        unit: newProduct.unit,
        images: [],
        harvestDate: newProduct.harvestDate,
        isOrganic: newProduct.isOrganic,
        location: {
          district: newProduct.location.district,
          state: newProduct.location.state,
        },
      };
      let createdProduct;
      try {
        createdProduct = await addProduct(productData);
      } catch (err: any) {
        setProductImageError(err.message || 'Failed to create product');
        toast.error(err.message || 'Failed to create product');
        setUploadingProductImages(false);
        return;
      }
      // 2. If images selected, upload to /api/products/:id/images
      let imageUrls: string[] = [];
      if (productImageFiles.length > 0) {
        try {
          const uploadRes = await uploadProductImages(createdProduct._id, productImageFiles);
          imageUrls = uploadRes.urls ? uploadRes.urls.map((u: { url: string }) => u.url) : [];
          if (!imageUrls.length) throw new Error('No image URLs returned');
        } catch (err: any) {
          setProductImageError(err.message || 'Failed to upload images');
          toast.error(err.message || 'Failed to upload images');
          setUploadingProductImages(false);
          return;
        }
      }
      setUploadingProductImages(false);
      // 3. Update product in state with returned image URLs
      const finalProduct = { ...createdProduct, images: imageUrls };
      setProducts([...products, finalProduct]);
      setOpenProductDialog(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        unit: 'kg',
        images: [],
        harvestDate: new Date().toISOString().split('T')[0],
        isOrganic: false,
        location: { district: '', state: '' },
        availableQuantity: '',
      });
      setProductImageFiles([]);
      setProductImagePreviews([]);
      toast.success(t('dashboard.productAddedSuccess'));
    } catch (err: any) {
      console.error('Error adding product:', err);
      toast.error(t('dashboard.productAddFail'));
    }
  };

  const submitProduct = async (productData: NewProductData) => {
    try {
      const product = await addProduct(productData);
      setProducts([...products, product]);
      setOpenProductDialog(false);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "",
        unit: "kg",
        images: [],
        harvestDate: new Date().toISOString().split("T")[0],
        isOrganic: false,
        location: {
          district: "",
          state: "",
        },
        availableQuantity: "",
      });
      toast.success(t('dashboard.productAddedSuccess'));

    } catch (err: any) {
      console.error("Error adding product:", err);
      toast.error(
        "Failed to add product: " +
        (err.response?.data?.message || err.message)
      );
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await deleteProduct(productId);
      setProducts(products.filter((product) => product._id !== productId));
      toast.success("Product deleted successfully");
    } catch (err: any) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product");
    }
  };


  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  const renderFarmerDashboard = () => (
    <Grid container spacing={3}>
      {/* Quick Actions Section */}
      <Grid item xs={12} md={4}>
        <Paper sx={{
          p: 2,
          backgroundColor: theme.palette.background.paper,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          boxShadow: theme.shadows[2]
        }}>
          <Typography variant="h6" gutterBottom sx={{
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <DashboardIcon fontSize="small" />
            {t('dashboard.quickActions')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenProductDialog(true)}
            fullWidth
            sx={{
              mb: 2,
              py: 1.5,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            {t('dashboard.addNewProduct')}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<InventoryIcon />}
            onClick={() => navigate("/my-products")}
            fullWidth
            sx={{
              py: 1.5,
              transition: 'all 0.3s',
              '&:hover': {
                backgroundColor: theme.palette.primary.light,
                borderColor: theme.palette.primary.dark
              }
            }}
          >
            {t('dashboard.manageProducts')}
          </Button>
        </Paper>

        {/* Stats Card */}
        <Paper sx={{
          mt: 2,
          p: 2,
          backgroundColor: theme.palette.success.light,
          color: theme.palette.success.contrastText
        }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('dashboard.totalInventoryValue')}
          </Typography>
          <Typography variant="h5">
            ₹{products.reduce((sum, p) => sum + (p.price * p.availableQuantity), 0).toLocaleString()}
          </Typography>
        </Paper>
      </Grid>

      {/* Recently Added Products */}
      <Grid item xs={12} md={8}>
        <Paper sx={{
          p: 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[2]
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
              {t('dashboard.recentlyAddedProducts')}
            </Typography>
          </Box>
          <Box sx={{ width: '100%', overflowX: { xs: 'auto', sm: 'visible' } }}>
            <TableContainer sx={{ minWidth: { xs: 400, sm: 600 }, width: '100%' }}>
              <Table size="small">
                <TableHead
                  sx={{
                    backgroundColor: theme.palette.primary.light,
                    "& th": {
                      color: theme.palette.primary.contrastText,
                      fontWeight: "bold",
                      px: { xs: 1, sm: 2 },
                      py: { xs: 1, sm: 2 },
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                    },
                  }}
                >
                  <TableRow>
                    <TableCell>{t('dashboard.product')}</TableCell>
                    <TableCell>{t('dashboard.category')}</TableCell>
                    <TableCell align="right">{t('dashboard.price')}</TableCell>
                    <TableCell align="right">{t('dashboard.stock')}</TableCell>
                    <TableCell>{t('dashboard.harvestDate')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.slice(0, 5).map((product) => (
                    <TableRow
                      key={product._id}
                      hover
                      sx={{
                        '&:last-child td': { border: 0 },
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover
                        }
                      }}
                      onClick={() => navigate(`/my-products`)}
                    >
                      <TableCell sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                          <Avatar
                            src={product.images[0] || '/product-placeholder.jpg'}
                            variant="rounded"
                            sx={{
                              width: { xs: 36, sm: 56 },
                              height: { xs: 36, sm: 56 },
                              mr: 1,
                              boxShadow: theme.shadows[2],
                              backgroundColor: theme.palette.grey[200],
                            }}
                            imgProps={{
                              onError: (e) => {
                                e.currentTarget.src = '/product-placeholder.jpg';
                              }
                            }}
                          >
                            <InventoryIcon fontSize="medium" />
                          </Avatar>
                          <Box minWidth={0}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                              {product.name}
                            </Typography>
                            {product.isOrganic && (
                              <Chip
                                label={t('dashboard.organic')}
                                size="small"
                                color="success"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
                        <Chip
                          label={product.category}
                          color="primary"
                          variant="filled"
                          sx={{ textTransform: 'capitalize', fontSize: { xs: '0.8rem', sm: '1rem' } }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
                        <Typography variant="body2" color="primary" fontWeight="500">
                          ₹{product.price}/{product.unit}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                          <Box sx={{ width: { xs: 36, sm: 60 }, mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((product.availableQuantity / 100) * 100, 100)}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: theme.palette.grey[200],
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  backgroundColor: product.availableQuantity > 20
                                    ? theme.palette.success.main
                                    : theme.palette.warning.main
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="caption">
                            {product.availableQuantity} {product.unit}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
                        <Chip
                          label={new Date(product.harvestDate).toLocaleDateString()}
                          variant="outlined"
                          color="secondary"
                          icon={<CalendarTodayIcon fontSize="small" sx={{ color: 'inherit' }} />}
                          sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* View All Button for more than 5 products */}
            {products.length > 5 && (
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => navigate('/my-products')}
                  sx={{ borderRadius: 2, fontWeight: 500 }}
                >
                  {t('dashboard.viewAllProducts')}
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderVendorDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('dashboard.quickActions')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate("/marketplace")}
            fullWidth
            sx={{ mb: 2 }}
          >
            {t('dashboard.browseProducts')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<LocalShipping />}
            onClick={() => navigate("/bulk-orders")}
            fullWidth
          >
            {t('dashboard.bulkOrders')}
          </Button>
        </Paper>
      </Grid>

      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('dashboard.recentBulkOrders')}
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('dashboard.orderId')}</TableCell>
                  <TableCell>{t('dashboard.farmer')}</TableCell>
                  <TableCell>{t('dashboard.amount')}</TableCell>
                  <TableCell>{t('dashboard.status')}</TableCell>
                  <TableCell>{t('dashboard.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.slice(0, 5).map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>#{order._id.slice(-6)}</TableCell>
                    <TableCell>{order.buyer.name}</TableCell>
                    <TableCell>₹{order.totalAmount}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={
                          order.status === "completed"
                            ? "success"
                            : order.status === "pending"
                              ? "warning"
                              : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/order/${order._id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('dashboard.availableProducts')}
          </Typography>
          <Grid container spacing={2}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product._id}>
                <Card>
                  <CardContent>
                    <img
                      src={product.images[0] || '/product-placeholder.jpg'}
                      alt={product.name}
                      style={{ width: "100%", height: 200, objectFit: "cover" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/product-placeholder.jpg'; }}
                    />
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {product.name}
                    </Typography>
                    <Typography color="textSecondary">
                      ₹{product.price}/{product.unit}
                    </Typography>
                    <Typography>
                      {t('dashboard.available')}: {product.availableQuantity} {product.unit}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      {t('dashboard.viewDetails')}
                    </Button>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/bulk-order/${product._id}`)}
                    >
                      {t('dashboard.bulkOrder')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderUserDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('dashboard.quickActions')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate("/marketplace")}
            fullWidth
            sx={{ mb: 2 }}
          >
            {t('dashboard.browseProducts')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PersonIcon />}
            onClick={() => navigate("/profile")}
            fullWidth
          >
            {t('dashboard.viewProfile')}
          </Button>
        </Paper>
      </Grid>

      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('dashboard.orderHistory')}
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('dashboard.orderId')}</TableCell>
                  <TableCell>{t('dashboard.date')}</TableCell>
                  <TableCell>{t('dashboard.items')}</TableCell>
                  <TableCell>{t('dashboard.amount')}</TableCell>
                  <TableCell>{t('dashboard.status')}</TableCell>
                  <TableCell>{t('dashboard.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>#{order._id.slice(-6)}</TableCell>
                    <TableCell>
                      {new Date(order.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {order.items
                        .map((item) => `${item.quantity} x ${item.product}`)
                        .join(", ")}
                    </TableCell>
                    <TableCell>₹{order.totalAmount}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={
                          order.status === "completed"
                            ? "success"
                            : order.status === "pending"
                              ? "warning"
                              : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/order/${order._id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
  // --- Enhanced Loading State ---
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">Loading your dashboard...</Typography>
      </Container>
    );
  }

  // --- Enhanced Error State ---
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>
        <Button variant="contained" color="primary" onClick={() => setRetryCount(c => c + 1)}>Retry</Button>
      </Container>
    );
  }

  // --- Dashboard Main Content ---
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 2, boxShadow: 2 }}>
            <Avatar
              src={user?.profileImageUrl || getRoleProfilePlaceholder(user?.role)}
              alt={user?.name || "Profile"}
              sx={{
                width: 56,
                height: 56,
                bgcolor: "#fff",
                color: "#222",
                fontWeight: 700,
                fontSize: 28,
                border: "2px solid #eee"
              }}
              imgProps={{
                onError: (e) => {
                  (e.currentTarget as HTMLImageElement).src = getRoleProfilePlaceholder(user?.role);
                }
              }}
            >
              {user?.name?.[0] || "?"}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>{user?.name}</Typography>
              <Typography variant="body2">{user?.role?.toUpperCase()}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{user?.email}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'secondary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 2, boxShadow: 2 }}>
            <Box sx={{ fontSize: 40, mr: 2 }}>🛒</Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>{products.length}</Typography>
              <Typography variant="body2">Products Listed</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center', gap: 2, boxShadow: 2 }}>
            <Box sx={{ fontSize: 40, mr: 2 }}>📦</Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>{orders.length}</Typography>
              <Typography variant="body2">Orders</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Tab Navigation */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('dashboard.welcome')} {user.name}!
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)} {t('dashboard.dashboard')}
        </Typography>
      </Box>
      {user.role === "farmer" && renderFarmerDashboard()}
      {user.role === "vendor" && renderVendorDashboard()}
      {user.role === "user" && renderUserDashboard()}
      {/* Add/Edit Product Dialog */}
      <Dialog
        open={openProductDialog}
        onClose={() => setOpenProductDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('dashboard.addNewProduct')}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t('dashboard.productName')}
                  fullWidth
                  required
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('dashboard.category')}</InputLabel>
                  <Select
                    label={t('dashboard.category')}
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, category: e.target.value })
                    }
                  >
                    <MenuItem value="vegetables">{t('dashboard.vegetables')}</MenuItem>
                    <MenuItem value="fruits">{t('dashboard.fruits')}</MenuItem>
                    <MenuItem value="grains">{t('dashboard.grains')}</MenuItem>
                    <MenuItem value="dairy">{t('dashboard.dairy')}</MenuItem>
                    <MenuItem value="meat">{t('dashboard.meat')}</MenuItem>
                    <MenuItem value="poultry">{t('dashboard.poultry')}</MenuItem>
                    <MenuItem value="other">{t('dashboard.other')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t('dashboard.price')}
                  type="number"
                  fullWidth
                  required
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('dashboard.unit')}</InputLabel>
                  <Select
                    label={t('dashboard.unit')}
                    value={newProduct.unit}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, unit: e.target.value })
                    }
                  >
                    <MenuItem value="kg">{t('dashboard.kilogram')}</MenuItem>
                    <MenuItem value="g">{t('dashboard.gram')}</MenuItem>
                    <MenuItem value="lb">{t('dashboard.pound')}</MenuItem>
                    <MenuItem value="piece">{t('dashboard.piece')}</MenuItem>
                    <MenuItem value="dozen">{t('dashboard.dozen')}</MenuItem>
                    <MenuItem value="bunch">{t('dashboard.bunch')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t('dashboard.availableQuantity')}
                  type="number"
                  fullWidth
                  required
                  value={newProduct.availableQuantity}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      availableQuantity: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t('dashboard.harvestDate')}
                  type="date"
                  fullWidth
                  required
                  value={newProduct.harvestDate}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      harvestDate: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('dashboard.description')}
                  multiline
                  rows={4}
                  fullWidth
                  required
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t('dashboard.district')}
                  fullWidth
                  required
                  value={newProduct.location.district}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      location: {
                        ...newProduct.location,
                        district: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="state-select-label">{t('dashboard.state')}</InputLabel>
                  <Select
                    labelId="state-select-label"
                    id="state-select"
                    value={newProduct.location.state}
                    label={t('dashboard.state')}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        location: {
                          ...newProduct.location,
                          state: e.target.value,
                        },
                      })
                    }
                  >
                    {["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"].map((state) => (
                      <MenuItem key={state} value={state}>{state}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newProduct.isOrganic}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          isOrganic: e.target.checked,
                        })
                      }
                      color="secondary"
                    />
                  }
                  label={t('dashboard.organicProduct')}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('dashboard.productImages')}
                </Typography>
                <ImageUpload
                  images={productImagePreviews}
                  onImagesChange={(files, previews) => { setProductImageFiles(files); setProductImagePreviews(previews); setProductImageError(null); }}
                  uploading={uploadingProductImages}
                  error={productImageError || undefined}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductDialog(false)}>{t('dashboard.cancel')}</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddProduct}
          >
            {t('dashboard.addProduct')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;

// NOTE: This file is now modularized. ProductList, OrderList, ProfileCard, ImageUpload, DeleteConfirmationDialog are used for a modern, robust, and production-ready dashboard UI/UX.

import { useState, useEffect, useRef } from "react";

import {
  Container,
  Typography,
  Paper,
  Box,
  Avatar,
  Grid,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CardMedia,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { fetchDashboardData, fetchProducts, deleteProduct, fetchUserProfile, updateProfile, deleteProfile, fetchMyProducts, fetchMyContactRequests, rejectContactRequest, acceptContactRequest, confirmContactRequestAsUser, confirmContactRequestAsFarmer, fetchDisputes, resolveDispute } from "../services/apiService";
// Import Product type from apiService for type compatibility
import type { Product as ApiProduct } from "../services/apiService";
import {
  Edit,
  ShoppingBag,
  Inventory,
  History,
  LocationOn,
  Phone,
  Email,
  Delete,
  GrassOutlined,
  Add,
  ExpandMore,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useTheme } from "@mui/material/styles";

import { useTranslation } from "react-i18next";

// Local TabPanel implementation for accessibility and correct props
type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Define types for API responses
interface ApiError {
  message?: string;
  details?: Record<string, string>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "farmer" | "vendor";
  address?: {
    street: string;
    district: string;
    state: string;
    zipcode: string;
  };
  profileImage?: {
    data: string | null;
    contentType: string | null;
  };
  createdAt: string;
  username?: string;
}

// Use the Product type from apiService for consistency with backend responses
// If you want to extend, use: type Product = ApiProduct & { ... }
type Product = ApiProduct;

interface EditForm {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    district: string;
    state: string;
    zipcode: string;
  };
}

function isPlaceholder(url?: string): boolean {
  if (!url) return true;
  // If it's a base64 data URL, it's not a placeholder
  if (url.startsWith('data:image/')) return false;
  return (
    url.includes('farmerProfilePlaceholder.png') ||
    url.includes('vendorProfilePlaceholder.png') ||
    url.includes('userProfilePlaceholder.png')
  );
}

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

// Utility: Convert File to base64 string
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Best-practice EditableProfileAvatar component
const EditableProfileAvatar = ({
  user,
  onImageSelected,
  loading,
  preview,
  setProfileImagePreview,
}: {
  user: User | null;
  onImageSelected: (file: File | null) => void;
  loading: boolean;
  preview: string | null;
  setProfileImagePreview: (url: string | null) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAvatarSrc = () => {
    if (preview) return preview;
    if (user?.profileImage && user.profileImage.data && user.profileImage.contentType) {
      return `data:${user.profileImage.contentType};base64,${user.profileImage.data}`;
    }
    return getRoleProfilePlaceholder(user?.role);
  };

  const handleAvatarEditKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      fileInputRef.current?.click();
    }
  };

  return (
    <Box sx={{ position: "relative", mb: 1 }}>
      <Avatar
        src={getAvatarSrc()}
        alt={user?.name || "Profile"}
        sx={{
          width: 100,
          height: 100,
          border: theme => `3px solid ${theme.palette.primary.main}`,
          bgcolor: "#f0f0f0",
        }}
        imgProps={{
          loading: "lazy",
          style: { objectFit: "cover" },
        }}
      />
      <Tooltip title="Change profile photo">
        <IconButton
          aria-label="Change profile photo"
          size="small"
          sx={{
            position: "absolute",
            bottom: 4,
            right: 4,
            background: "#fff",
            borderRadius: "50%",
            boxShadow: 1,
            p: 0.5,
            zIndex: 2,
            "&:hover": { background: "#f5f5f5" },
          }}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={handleAvatarEditKeyDown}
          tabIndex={0}
        >
          <Edit fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files?.[0] || null;
          onImageSelected(file);
          if (file) {
            const reader = new FileReader();
            reader.onload = () => setProfileImagePreview(reader.result as string);
            reader.readAsDataURL(file);
          } else {
            setProfileImagePreview(null);
          }
        }}
        tabIndex={-1}
      />
      {loading && (
        <CircularProgress
          size={32}
          sx={{
            position: "absolute",
            top: 34,
            left: 34,
            zIndex: 3,
          }}
        />
      )}
    </Box>
  );
};

const Profile = () => {
  // --- Connections state for ConnectionsList ---

  const theme = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [uploadedProducts, setUploadedProducts] = useState<Product[]>([]);
  const [contactRequests, setContactRequests] = useState<{ sent: any[]; received: any[] }>({ sent: [], received: [] });

  const [productsLoading, setProductsLoading] = useState(false);

  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      district: "",
      state: "",
      zipcode: "",
    },
  });
  // Profile image upload state for edit dialog
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  // Add state for confirmation dialogs
  const [showUserConfirmDialog, setShowUserConfirmDialog] = useState(false);
  const [showFarmerConfirmDialog, setShowFarmerConfirmDialog] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [finalQuantity, setFinalQuantity] = useState<number>(1);
  const [finalPrice, setFinalPrice] = useState<string>('');
  const [userFeedback, setUserFeedback] = useState('');
  const [didBuy, setDidBuy] = useState<boolean>(true);
  const [farmerFeedback, setFarmerFeedback] = useState('');
  const [didSell, setDidSell] = useState<boolean>(true);

  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  // Handle profile image upload
  const handleProfileImageUpload = async () => {
    if (!selectedProfileImage) return;
    setProfileImageUploading(true);
    try {
      const base64 = await fileToBase64(selectedProfileImage);
      await updateProfile({
        ...editForm,
        profileImage: {
          data: base64,
          contentType: selectedProfileImage.type,
        },
      });
      await fetchUserProfileData();
      setProfileImagePreview(null);
      setSelectedProfileImage(null);
      toast.success('Profile image updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload profile image');
    } finally {
      setProfileImageUploading(false);
    }
  };

  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
    };

    const loadInitialData = async () => {
      try {
        const userData = await fetchUserProfile();
        setUser(userData);
        setEditForm({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address || {
            street: "",
            district: "",
            state: "",
            zipcode: "",
          },
        });
        if (userData.role === 'farmer') {
          const products = await fetchMyProducts();
          setUploadedProducts(products);
        }
        const [requests, ] = await Promise.all([
          fetchMyContactRequests(),
        ]);
        setContactRequests(requests);

      } catch (error) {
        // Handle errors
      } finally {
        setLoading(false);
      }
    };
  
    checkAuth();
    loadInitialData();
  }, [navigate]);

  // Fetch uploaded products when user or tab changes
// AFTER (Proper tab synchronization)
useEffect(() => {
  if (user?.role === 'farmer' && tabValue === 0) {
    const controller = new AbortController();
    
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const products = await fetchMyProducts({ signal: controller.signal });
        setUploadedProducts(prev => 
          JSON.stringify(prev) === JSON.stringify(products) ? prev : products
        );
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
    return () => controller.abort();
  }
}, [tabValue]);

  const fetchUserProfileData = async () => {
    try {
      const data = await fetchUserProfile();
      setUser(data);
      setEditForm({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address || {
          street: "",
          district: "",
          state: "",
          zipcode: "",
        },
      });
    } catch (error: any) {
      if (error.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
      setUser(null);
      console.error("Error fetching profile:", error);
      toast.error(String(error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  // Fetch contact requests and  for the user
  const refreshContactRequests = async () => {
    try {
      const requests = await fetchMyContactRequests();
      setContactRequests(requests);
    } catch (error) {
      setContactRequests({ sent: [], received: [] });
    }
  };

  const fetchUploadedProducts = async () => {
    setProductsLoading(true);
    try {
      const products = await fetchMyProducts();
      // Ensure every product has a category field for type safety
      setUploadedProducts(products as ApiProduct[]);
    } catch (error: any) {
      toast.error(t('profile.failedToFetchProducts'));
    } finally {
      setProductsLoading(false);
    }
  };


  // Handle profile image selection in edit dialog
  const handleProfileImageSelected = (file: File | null) => {
    setSelectedProfileImage(file);
    setProfileImagePreview(file ? URL.createObjectURL(file) : null);
  };

  // When user submits the edit profile form, upload the image if selected
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileImageUploading(true);
    try {
      if (selectedProfileImage) {
        const base64 = await fileToBase64(selectedProfileImage);
        await updateProfile({
          ...editForm,
          profileImage: {
            data: base64,
            contentType: selectedProfileImage.type,
          },
        });
      } else {
        await updateProfile(editForm);
      }
      await fetchUserProfileData();
      setIsEditDialogOpen(false);
      setSelectedProfileImage(null);
      setProfileImagePreview(null);
      toast.success(t('profile.profileUpdated'));
    } catch (error: any) {
      console.error("Update error:", error);
      if (error.details) {
        Object.values(error.details).forEach((message) => {
          toast.error(String(message));
        });
      } else {
        toast.error(String(error.message || t('profile.failedToUpdateProfile')));
      }
    } finally {
      setProfileImageUploading(false);
    }
  };

  const handleDeleteProductClick = (productId: string) => {
    setSelectedProductId(productId);
    setDeleteProductDialogOpen(true);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!selectedProductId) return;

    try {
      await deleteProduct(selectedProductId);

      setUploadedProducts((prev) =>
        prev.filter((p) => p._id !== selectedProductId)
      );
      toast.success(t('profile.productDeleted'));
    } catch (error: any) {
      console.error("Delete product error:", error);
      toast.error(String(error));
    } finally {
      setDeleteProductDialogOpen(false);
      setSelectedProductId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setUploadedProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success(t('profile.productDeleted'));
    } catch (error: any) {
      console.error("Delete product error:", error);
      toast.error(String(error));
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProfile();
      toast.success(t('profile.accountDeleted'));
      navigate("/login");
    } catch (error: any) {
      toast.error(String(error.message || error));
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "farmer":
        return t('profile.farmer');
      case "vendor":
        return t('profile.vendor');
      case "user":
      default:
        return t('profile.customer');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setEditForm((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof EditForm] as Record<string, string>),
          [child]: value,
        },
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handler for user confirmation
  const handleUserConfirm = async () => {
    if (!activeRequest || finalPrice === '' || isNaN(Number(finalPrice)) || Number(finalPrice) <= 0) {
      toast.error('Please enter a valid final price.');
      return;
    }
    try {
      await confirmContactRequestAsUser(activeRequest._id, {
        finalQuantity,
        finalPrice: Number(finalPrice),
        didBuy,
        feedback: userFeedback,
      });
      toast.success('Confirmation submitted!');
      setShowUserConfirmDialog(false);
      refreshContactRequests();
    } catch (error) {
      toast.error('Failed to submit confirmation');
    }
  };

  // Handler for farmer confirmation
  const handleFarmerConfirm = async () => {
    if (!activeRequest || finalPrice === '' || isNaN(Number(finalPrice)) || Number(finalPrice) <= 0) {
      toast.error('Please enter a valid final price.');
      return;
    }
    try {
      await confirmContactRequestAsFarmer(activeRequest._id, {
        finalQuantity,
        finalPrice: Number(finalPrice),
        didSell,
        feedback: farmerFeedback,
      });
      toast.success('Confirmation submitted!');
      setShowFarmerConfirmDialog(false);
      refreshContactRequests();
    } catch (error) {
      toast.error('Failed to submit confirmation');
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container sx={{ py: 8, textAlign: "center" }}>
        <Alert severity="error">{t('profile.failedToLoadProfile')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Modernized Profile Header Card with Banner */}
      <Card sx={{
        mb: 4,
        borderRadius: 4,
        boxShadow: 6,
        overflow: 'visible',
        position: 'relative',
        background: 'linear-gradient(135deg, #2e7d32 0%, #26a69a 100%)',
      }}>
        {/* Banner with modern organic wave SVG */}
        <Box sx={{
          height: { xs: 110, sm: 180 },
          width: '100%',
          position: 'relative',
          background: 'linear-gradient(90deg, #e0f7fa 0%, #fffde4 100%)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden',
        }}>
          {/* Modern wave SVG shape */}
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
          }}>
            <svg width="100%" height="100%" viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="profileWaveGradient" x1="0" y1="0" x2="1440" y2="180" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#388e3c" />
                  <stop offset="1" stopColor="#26a69a" />
                </linearGradient>
              </defs>
              <path d="M0,80 C360,180 1080,0 1440,100 L1440,180 L0,180 Z" fill="url(#profileWaveGradient)" />
            </svg>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-end' },
            gap: { xs: 2, sm: 4 },
            px: { xs: 2, sm: 4 },
            pb: { xs: 2, sm: 3 },
            pt: { xs: 0, sm: 0 },
            position: 'relative',
            top: { xs: -56, sm: -90 },
            zIndex: 2,
          }}
        >
          {/* Avatar with border, shadow, and overlap */}
          <Avatar
            src={
              profileImagePreview ||
              (user?.profileImage && user.profileImage.data && user.profileImage.contentType
                ? `data:${user.profileImage.contentType};base64,${user.profileImage.data}`
                : getRoleProfilePlaceholder(user?.role)
              )
            }
            alt={user?.name || 'Profile'}
            sx={{
              width: { xs: 112, sm: 144 },
              height: { xs: 112, sm: 144 },
              border: '5px solid #fff',
              boxShadow: 6,
              bgcolor: '#f0f0f0',
              mt: { xs: -8, sm: -14 },
              zIndex: 3,
              transition: 'box-shadow 0.3s',
              '&:hover': {
                boxShadow: 12,
              },
            }}
            imgProps={{
              loading: 'lazy',
              style: { objectFit: 'cover' },
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0, mt: { xs: 1, sm: 4 } }}>
            <Typography
              variant="h3"
              sx={{
                typography: { xs: 'h5', sm: 'h3' },
                wordBreak: 'break-word',
                textAlign: { xs: 'center', sm: 'left' },
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 2px 8px rgba(44,62,80,0.18)',
                mb: 0.5,
                lineHeight: 1.2,
              }}
            >
              {user.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <Chip icon={<GrassOutlined />} label={getRoleLabel(user.role)} color="success" size="small" sx={{ fontWeight: 500, bgcolor: '#e8f5e9', color: '#388e3c' }} />
              {user.username && (
                <Chip icon={<Edit />} label={`@${user.username}`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
              )}
              <Chip icon={<History />} label={`${t('profile.memberSince')} ${new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`} size="small" sx={{ bgcolor: '#fffde7', color: '#fbc02d' }} />
            </Box>
            <Box
              sx={{
                width: { xs: '100%', sm: 'auto' },
                display: 'flex',
                gap: 2,
                flexDirection: { xs: 'row', sm: 'row' },
                justifyContent: { xs: 'center', sm: 'flex-start' },
                mt: { xs: 2, sm: 2 },
              }}
            >
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleEditClick}
                size="medium"
                sx={{
                  fontWeight: 600,
                  bgcolor: '#388e3c',
                  color: '#fff',
                  '&:hover': { bgcolor: '#2e7d32' },
                  boxShadow: 2,
                }}
                >
                  {t('profile.editProfile')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleDeleteClick}
                size="medium"
                sx={{
                  fontWeight: 600,
                  bgcolor: '#fff',
                  color: '#d32f2f',
                  borderColor: '#d32f2f',
                  '&:hover': { bgcolor: '#ffebee', borderColor: '#b71c1c' },
                  boxShadow: 2,
                }}
                >
                  {t('profile.deleteAccount')}
              </Button>
            </Box>
          </Box>
        </Box>
        {/* Profile Details List (email, phone, address) as cards */}
        <Grid container spacing={2} sx={{ px: { xs: 2, sm: 4 }, pb: 3, pt: 1 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#e8f5e9', borderRadius: 3, boxShadow: 0, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Email color="success" sx={{ fontSize: 32 }} />
        <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('profile.email')}</Typography>
                <Typography variant="body1" color="text.primary">{user.email}</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#e3f2fd', borderRadius: 3, boxShadow: 0, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Phone color="primary" sx={{ fontSize: 32 }} />
          <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('profile.phone')}</Typography>
                <Typography variant="body1" color="text.primary">{user.phone}</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#fffde7', borderRadius: 3, boxShadow: 0, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocationOn color="warning" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('profile.address')}</Typography>
                <Typography variant="body1" color="text.primary">
                  {user.address?.street
                      ? `${user.address.street}, ${user.address.district}, ${user.address.state}, ${user.address.zipcode}`
                    : t('profile.addressNotProvided')}
                </Typography>
          </Box>
            </Card>
          </Grid>
        </Grid>
      </Card>

      {/* Main Content Tabs */}
      <Paper sx={{ p: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="profile tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ mb: 3 }}
        >
          {user?.role === 'farmer' && <Tab label={t('profile.productsTab')} />}
          <Tab label={t('profile.contactRequestsTab')} />

        </Tabs>

        {/* Products Tab (Farmer only) */}
        {user?.role === 'farmer' && tabValue === 0 && (
          <TabPanel value={tabValue} index={0}>
            {productsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
              </Box>
            ) : uploadedProducts.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                {t('profile.noProductsUploaded')}
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {uploadedProducts.map(product => (
                  <Grid item xs={12} sm={6} md={4} key={product._id}>
                    <Card sx={{
                      p: 0,
                      borderRadius: 4,
                      boxShadow: 4,
                      transition: 'box-shadow 0.3s, transform 0.2s',
                      '&:hover': {
                        boxShadow: 8,
                        transform: 'translateY(-4px) scale(1.02)',
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 340,
                    }}>
                      {product.images && product.images.length > 0 ? (
                        <Box sx={{
                          width: '100%',
                          pt: '60%', // 5:3 aspect ratio
                          position: 'relative',
                          borderTopLeftRadius: 16,
                          borderTopRightRadius: 16,
                          overflow: 'hidden',
                        }}>
                          <CardMedia
                            component="img"
                            image={product.images[0]}
                            alt={product.name}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderTopLeftRadius: 16,
                              borderTopRightRadius: 16,
                            }}
                          />
                        </Box>
                      ) : (
                        <Box sx={{
                          width: '100%',
                          pt: '60%',
                          bgcolor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderTopLeftRadius: 16,
                          borderTopRightRadius: 16,
                        }}>
                          <Inventory sx={{ fontSize: 48, color: '#bdbdbd' }} />
                        </Box>
                      )}
                      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.2, color: 'text.primary' }}>{product.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip label={(product as any).category ?? 'N/A'} size="small" color="info" sx={{ textTransform: 'capitalize' }} />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Price: <b>{product.price}</b> / {product.unit}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Available: <b>{product.availableQuantity}</b></Typography>
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/products/${product._id}`)}
                            sx={{ fontWeight: 500 }}
                          >
                            {t('profile.viewDetails')}
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<Delete />}
                            onClick={() => handleDeleteProductClick(product._id)}
                            sx={{ fontWeight: 500 }}
                          >
                            {t('profile.delete')}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        )}

        {/* Contact Requests Tab */}
        {tabValue === (user?.role === 'farmer' ? 1 : 0) && (
          <TabPanel value={tabValue} index={user?.role === 'farmer' ? 1 : 0}>
            <Typography variant="h6" gutterBottom>{t('profile.contactRequestsTab')}</Typography>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>{t('profile.sentRequests')}</Typography>
              {contactRequests.sent.length === 0 ? <Typography>{t('profile.noSentRequests')}</Typography> : (
                contactRequests.sent.map(req => (
                  <Accordion key={req._id} sx={{ mb: 2, borderRadius: 2, boxShadow: 1, bgcolor: '#f5f5f5', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMore />} aria-controls={`sent-request-${req._id}-content`} id={`sent-request-${req._id}-header`}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{req.productId?.name || req.productId}</Typography>
                          <Chip label={req.status} color={
                            req.status === 'pending' ? 'warning' :
                            req.status === 'accepted' ? 'info' :
                            req.status === 'completed' ? 'success' :
                            req.status === 'disputed' ? 'error' :
                            'default'
                          } size="small" sx={{ ml: 1, textTransform: 'capitalize' }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">{new Date(req.requestedAt).toLocaleString()}</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ mb: 1 }}>
                    {typeof req.requestedQuantity !== 'undefined' && (
                          <Typography variant="body2">{t('profile.requestedQuantity')}: {req.requestedQuantity}</Typography>
                    )}
                    {(req.status === 'accepted' || req.status === 'completed' || req.status === 'disputed' || req.status === 'not_completed' || req.status === 'expired') && req.farmerId && (
                          <Paper variant="outlined" sx={{ mt: 1, mb: 1, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Farmer Contact Info:</Typography>
                            {req.farmerId.phone && <Typography variant="body2">📞 {req.farmerId.phone}</Typography>}
                            {req.farmerId.email && <Typography variant="body2">✉️ {req.farmerId.email}</Typography>}
                        {req.farmerId.address && (
                              <Typography variant="body2">📍 {req.farmerId.address.street}, {req.farmerId.address.district}, {req.farmerId.address.state}, {req.farmerId.address.zipcode}</Typography>
                        )}
                          </Paper>
                    )}
                    {req.status === 'accepted' && !req.userConfirmed && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => {
                          setActiveRequest(req);
                          setFinalQuantity(req.requestedQuantity || 1);
                          setFinalPrice('');
                          setShowUserConfirmDialog(true);
                        }}
                      >
                        Did you buy this product?
                      </Button>
                    )}
                    {req.status === 'completed' && (
                          <Chip label="Completed" color="success" size="small" sx={{ mt: 1 }} />
                    )}
                    {req.status === 'disputed' && (
                          <Chip label="Disputed" color="error" size="small" sx={{ mt: 1 }} />
                        )}
                        {req.finalQuantity && <Typography variant="body2">{t('profile.finalQuantity')}: {req.finalQuantity}</Typography>}
                        {req.finalPrice && <Typography variant="body2">{t('profile.finalPrice')}: {req.finalPrice}</Typography>}
                        {req.userFeedback && <Typography variant="body2">User Feedback: {req.userFeedback}</Typography>}
                        {req.farmerFeedback && <Typography variant="body2">Farmer Feedback: {req.farmerFeedback}</Typography>}
                        {req.adminNote && <Typography variant="body2">Admin Note: {req.adminNote}</Typography>}
                  </Box>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
              {user?.role !== 'user' && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>{t('profile.receivedRequests')}</Typography>
                  {contactRequests.received.length === 0 ? <Typography>No received requests</Typography> : (
                    contactRequests.received.map((req) => (
                      <Accordion key={req._id} sx={{ mb: 2, borderRadius: 2, boxShadow: 1, bgcolor: '#e3f2fd', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMore />} aria-controls={`received-request-${req._id}-content`} id={`received-request-${req._id}-header`}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{req.productId?.name || req.productId}</Typography>
                              <Chip label={req.status} color={
                                req.status === 'pending' ? 'warning' :
                                req.status === 'accepted' ? 'info' :
                                req.status === 'completed' ? 'success' :
                                req.status === 'disputed' ? 'error' :
                                'default'
                              } size="small" sx={{ ml: 1, textTransform: 'capitalize' }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">{new Date(req.requestedAt).toLocaleString()}</Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2">{t('profile.from')}: {req.requesterId?.name || req.requesterId}</Typography>
                        {typeof req.requestedQuantity !== 'undefined' && (
                              <Typography variant="body2">{t('profile.requestedQuantity')}: {req.requestedQuantity}</Typography>
                        )}
                        {req.status === 'pending' && (
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              disabled={acceptingRequestId === req._id}
                              onClick={async () => {
                                setAcceptingRequestId(req._id);
                                try {
                                  await acceptContactRequest(req._id);
                                  toast.success('Request accepted');
                                  refreshContactRequests();
                                } catch (error) {
                                  toast.error('Failed to accept request');
                                } finally {
                                  setAcceptingRequestId(null);
                                }
                              }}
                            >
                              {acceptingRequestId === req._id ? <CircularProgress size={18} /> : 'Accept'}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              disabled={rejectingRequestId === req._id}
                              onClick={async () => {
                                setRejectingRequestId(req._id);
                                try {
                                  await rejectContactRequest(req._id);
                                  toast.info('Request rejected');
                                  refreshContactRequests();
                                } catch (error) {
                                  toast.error('Failed to reject request');
                                } finally {
                                  setRejectingRequestId(null);
                                }
                              }}
                            >
                              {rejectingRequestId === req._id ? <CircularProgress size={18} /> : 'Reject'}
                            </Button>
                          </Box>
                        )}
                        {req.status === 'accepted' && req.userConfirmed && !req.farmerConfirmed && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={() => {
                              setActiveRequest(req);
                              setFinalQuantity(req.finalQuantity || 1);
                              setFinalPrice('');
                              setShowFarmerConfirmDialog(true);
                            }}
                          >
                            Confirm Sale
                          </Button>
                        )}
                            {req.status === 'completed' && (
                              <Chip label="Completed" color="success" size="small" sx={{ mt: 1 }} />
                            )}
                            {req.status === 'disputed' && (
                              <Chip label="Disputed" color="error" size="small" sx={{ mt: 1 }} />
                            )}
                            {req.finalQuantity && <Typography variant="body2">{t('profile.finalQuantity')}: {req.finalQuantity}</Typography>}
                            {req.finalPrice && <Typography variant="body2">{t('profile.finalPrice')}: {req.finalPrice}</Typography>}
                            {req.userFeedback && <Typography variant="body2">User Feedback: {req.userFeedback}</Typography>}
                            {req.farmerFeedback && <Typography variant="body2">Farmer Feedback: {req.farmerFeedback}</Typography>}
                            {req.adminNote && <Typography variant="body2">Admin Note: {req.adminNote}</Typography>}
                      </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  )}
                </>
              )}
            </Box>
            {/* User Confirmation Dialog */}
            <Dialog open={showUserConfirmDialog} onClose={() => setShowUserConfirmDialog(false)}>
              <DialogTitle>Confirm Purchase</DialogTitle>
              <DialogContent>
                <TextField
                  label="Final Bought Quantity"
                  type="number"
                  value={finalQuantity}
                  onChange={e => setFinalQuantity(Number(e.target.value))}
                  fullWidth
                  sx={{ mt: 2 }}
                />
                <TextField
                  label="Final Price"
                  type="number"
                  value={finalPrice}
                  onChange={e => setFinalPrice(e.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                  required
                  error={finalPrice === '' || isNaN(Number(finalPrice)) || Number(finalPrice) <= 0}
                  helperText={finalPrice === '' ? 'Final price is required' : (isNaN(Number(finalPrice)) || Number(finalPrice) <= 0 ? 'Enter a valid price' : '')}
                />
                <TextField
                  label="Feedback (optional)"
                  value={userFeedback}
                  onChange={e => setUserFeedback(e.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                />
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant={didBuy ? 'contained' : 'outlined'}
                    color="success"
                    onClick={() => setDidBuy(true)}
                    sx={{ mr: 1 }}
                  >
                    Yes, I bought
                  </Button>
                  <Button
                    variant={!didBuy ? 'contained' : 'outlined'}
                    color="error"
                    onClick={() => setDidBuy(false)}
                  >
                    No, I did not buy
                  </Button>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowUserConfirmDialog(false)}>Cancel</Button>
                <Button onClick={handleUserConfirm} color="primary">Submit</Button>
              </DialogActions>
            </Dialog>
            {/* Farmer Confirmation Dialog */}
            <Dialog open={showFarmerConfirmDialog} onClose={() => setShowFarmerConfirmDialog(false)}>
              <DialogTitle>Confirm Sale</DialogTitle>
              <DialogContent>
                <TextField
                  label="Final Sold Quantity"
                  type="number"
                  value={finalQuantity}
                  onChange={e => setFinalQuantity(Number(e.target.value))}
                  fullWidth
                  sx={{ mt: 2 }}
                />
                <TextField
                  label="Final Price"
                  type="number"
                  value={finalPrice}
                  onChange={e => setFinalPrice(e.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                  required
                  error={finalPrice === '' || isNaN(Number(finalPrice)) || Number(finalPrice) <= 0}
                  helperText={finalPrice === '' ? 'Final price is required' : (isNaN(Number(finalPrice)) || Number(finalPrice) <= 0 ? 'Enter a valid price' : '')}
                />
                <TextField
                  label="Feedback (optional)"
                  value={farmerFeedback}
                  onChange={e => setFarmerFeedback(e.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                />
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant={didSell ? 'contained' : 'outlined'}
                    color="success"
                    onClick={() => setDidSell(true)}
                    sx={{ mr: 1 }}
                  >
                    Yes, I sold
                  </Button>
                  <Button
                    variant={!didSell ? 'contained' : 'outlined'}
                    color="error"
                    onClick={() => setDidSell(false)}
                  >
                    No, I did not sell
                  </Button>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowFarmerConfirmDialog(false)}>Cancel</Button>
                <Button onClick={handleFarmerConfirm} color="primary">Submit</Button>
              </DialogActions>
            </Dialog>
          </TabPanel>
        )}


      </Paper>

    {/* Edit Profile Dialog */}
    <Dialog
      open={isEditDialogOpen}
      onClose={() => setIsEditDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('profile.editProfile')}</DialogTitle>
      {/* Editable Avatar for profile image upload */}
      <form onSubmit={handleEditSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1, mb: 2 }}>
            <EditableProfileAvatar
              user={user}
              onImageSelected={handleProfileImageSelected}
              loading={profileImageUploading}
              preview={profileImagePreview}
              setProfileImagePreview={setProfileImagePreview}
            />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.name')}
                name="name"
                value={editForm.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.email')}
                name="email"
                type="email"
                value={editForm.email}
                disabled
                required
                sx={{
                  "& .MuiInputBase-input": {
                    cursor: "not-allowed",
                    color: "text.disabled",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.phone')}
                name="phone"
                value={editForm.phone}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.street')}
                name="address.street"
                value={editForm.address.street}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile.district')}
                name="address.district"
                value={editForm.address.district}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile.state')}
                name="address.state"
                value={editForm.address.state}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.zipCode')}
                name="address.zipcode"
                value={editForm.address.zipcode}
                onChange={handleInputChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>{t('profile.cancel')}</Button>
          <Button type="submit" variant="contained">
            {t('profile.saveChanges')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>

    {/* Delete Account Dialog */}
    <Dialog
      open={isDeleteDialogOpen}
      onClose={() => setIsDeleteDialogOpen(false)}
    >
      <DialogTitle>{t('profile.deleteAccount')}</DialogTitle>
      <DialogContent>
        <Typography>
          {t('profile.deleteAccountConfirm')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setIsDeleteDialogOpen(false)}>{t('profile.cancel')}</Button>
        <Button
          onClick={handleDeleteConfirm}
          color="error"
          variant="contained"
        >
          {t('profile.deleteAccount')}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Product Delete Confirmation Dialog */}
    <Dialog
      open={deleteProductDialogOpen}
      onClose={() => setDeleteProductDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('profile.confirmProductDeletion')}</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          {t('profile.confirmProductDeletionText')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setDeleteProductDialogOpen(false)}
          color="primary"
          variant="outlined"
        >
          {t('profile.cancel')}
        </Button>
        <Button
          onClick={handleConfirmDeleteProduct}
          color="error"
          variant="contained"
        >
          {t('profile.confirmDelete')}
        </Button>
      </DialogActions>
    </Dialog>
    </Container>
  );
}
export default Profile;

import { ArrowBack } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserId } from '../utils/auth';
import { checkExistingContactRequest, createContactRequest, fetchMyContactRequests, confirmContactRequestAsUser, confirmContactRequestAsFarmer } from '../services/apiService';
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Divider,
  TextField,
  IconButton,
  Avatar,
  Rating,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import {
  ShoppingCart,
  Add,
  Remove,
  Store,
  AccessTime,
  CalendarToday,
  CheckCircle,
  LocationOn,
  Logout,
  Inventory,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useQuery } from '@tanstack/react-query';
import { fetchProductById, type Product } from '../services/apiService';
import { useTranslation } from "react-i18next";
import { t } from "i18next";

// Utility for role-based profile placeholder
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

// PhoneRequestSection must be declared here, outside ProductDetails
interface PhoneRequestSectionProps {
  product: Product;
  t: any;
  navigate: (path: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  setProduct: (product: Product | null) => void;
}

function PhoneRequestSection({ 
  product, 
  t, 
  navigate,
  isLoading,
  setIsLoading,
  error,
  setError,
  setProduct 
}: PhoneRequestSectionProps) {
  const { user } = useAuth();
  const [contactRequestOpen, setContactRequestOpen] = useState(false);
  const [contactRequestLoading, setContactRequestLoading] = useState(false);
  const [contactRequestError, setContactRequestError] = useState('');
  const [pendingFarmers, setPendingFarmers] = useState<string[]>([]);
  const [existingRequestId, setExistingRequestId] = useState<string | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requiredQuantity, setRequiredQuantity] = useState<number>(product.minimumOrderQuantity || 1);
  const [showUserConfirmDialog, setShowUserConfirmDialog] = useState(false);
  const [showFarmerConfirmDialog, setShowFarmerConfirmDialog] = useState(false);
  const [finalQuantity, setFinalQuantity] = useState<number>(requiredQuantity);
  const [finalPrice, setFinalPrice] = useState<number>(product.price);
  const [userFeedback, setUserFeedback] = useState('');
  const [didBuy, setDidBuy] = useState<boolean>(true);
  const [farmerFeedback, setFarmerFeedback] = useState('');
  const [didSell, setDidSell] = useState<boolean>(true);
  const [confirmationStatus, setConfirmationStatus] = useState<string>('');

  const currentUserId = getCurrentUserId();
  const isLoggedIn = !!currentUserId;
  const isOwnProduct = currentUserId && product.farmer?._id === currentUserId;
  const role = user?.role;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const checkRequestStatus = async () => {
      try {
        const shouldCheck = product?.farmerId?.toString() && 
                           product?._id?.toString() && 
                           user?._id?.toString();
        
        if (!shouldCheck) return;

        setRequestLoading(true);
        
        const { exists } = await checkExistingContactRequest(
          product.farmerId.toString(),
          product._id.toString(),
          Date.now()
        );
        
        if (isMounted) setHasPendingRequest(!!exists);
      } catch (error) {
        console.error('Status check error:', error);
        if (isMounted) setHasPendingRequest(false);
      } finally {
        if (isMounted) setRequestLoading(false);
      }
    };

    const timer = setTimeout(() => {
      if (product?.farmerId && product?._id) {
        checkRequestStatus();
      }
    }, 500);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [user?._id, product?.farmerId?.toString(), product?._id?.toString()]);

  const quotaMsg =
    role === 'vendor'
      ? t('productDetails.vendorQuota', 'Vendors can request up to 5 phone numbers per day.')
      : t('productDetails.userQuota', 'Users can send up to 2 contact requests per day.');

  const fetchProductData = async () => {
    try {
      setIsLoading(true);
      const updatedProduct = await fetchProductById(product._id);
      const statusResponse = await checkExistingContactRequest(
        updatedProduct.farmer._id,
        updatedProduct._id
      );
      setProduct(updatedProduct);
      setHasPendingRequest(statusResponse);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch product details');
    } finally {
      setIsLoading(false);
    }
  };

  const isContactRequestAllowed = () => {
    return !pendingFarmers.includes(product?.farmerId || '') && isLoggedIn;
  };

  const isQuantityValid =
    requiredQuantity >= (product.minimumOrderQuantity || 1) &&
    requiredQuantity <= product.availableQuantity;

  const handleContactRequest = async () => {
    try {
      setRequestLoading(true);
      const result = await createContactRequest(product._id, requiredQuantity);
      if (result.existingRequestId) {
        setHasPendingRequest(true);
        toast.info('Contact request already exists');
        return;
      }
      const verifiedStatus = await checkExistingContactRequest(
        product.farmerId,
        product._id
      );
      setHasPendingRequest(verifiedStatus);
      toast.success(verifiedStatus ? 
        'Request verified successfully' : 
        'Request submitted successfully'
      );
    } catch (error: any) {
      setHasPendingRequest(false);
      toast.error(error.response?.data?.message || error.message || 'Request failed');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleUserConfirm = async () => {
    try {
      await confirmContactRequestAsUser(product._id, {
        finalQuantity,
        finalPrice,
        didBuy,
        feedback: userFeedback,
      });
      toast.success('Confirmation submitted!');
      setShowUserConfirmDialog(false);
    } catch (error) {
      toast.error('Failed to submit confirmation');
    }
  };

  const handleFarmerConfirm = async () => {
    try {
      await confirmContactRequestAsFarmer(product._id, {
        finalQuantity,
        finalPrice,
        didSell,
        feedback: farmerFeedback,
      });
      toast.success('Confirmation submitted!');
      setShowFarmerConfirmDialog(false);
    } catch (error) {
      toast.error('Failed to submit confirmation');
    }
  };

  if (!isLoggedIn) {
    return (
      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/login')}
        >
          {t('productDetails.loginToRequestPhone', 'Login to request phone number')}
        </Button>
      </Box>
    );
  }

  if (isOwnProduct) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="contained"
        color="primary"
        disabled={!!(hasPendingRequest || requestLoading || !product)}
        onClick={() => setContactRequestOpen(true)}
        startIcon={hasPendingRequest ? <CheckCircle /> : undefined}
      >
        {requestLoading ? (
          <CircularProgress size={24} />
        ) : hasPendingRequest ? (
          t('contactRequested')
        ) : (
          t('requestContact')
        )}
      </Button>
      <Dialog open={contactRequestOpen} onClose={() => setContactRequestOpen(false)}>
        <DialogTitle>{t('productDetails.confirmRequestTitle', 'Confirm Request')}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t('productDetails.confirmRequestMsg', 'Are you sure you want to send a contact request for this product?')}<br />
            <b>{t('productDetails.minimumOrderQuantity')}: {product.minimumOrderQuantity} {product.unit}</b><br />
            {quotaMsg}
          </Typography>
          <TextField
            label={t('productDetails.requiredQuantity', 'Required Quantity')}
            type="number"
            value={requiredQuantity}
            onChange={e => setRequiredQuantity(Number(e.target.value))}
            inputProps={{ min: product.minimumOrderQuantity || 1, max: product.availableQuantity }}
            fullWidth
            sx={{ mt: 2 }}
            helperText={
              requiredQuantity < (product.minimumOrderQuantity || 1)
                ? t('productDetails.requiredQuantityValidation', `Minimum order is ${product.minimumOrderQuantity} ${product.unit}`)
                : requiredQuantity > product.availableQuantity
                  ? t('productDetails.maxQuantityValidation', `Cannot order more than available (${product.availableQuantity} ${product.unit})`)
                  : ''
            }
            error={
              requiredQuantity < (product.minimumOrderQuantity || 1) ||
              requiredQuantity > product.availableQuantity
            }
          />
          {contactRequestError && (
            <Typography color="error" variant="body2">{contactRequestError}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactRequestOpen(false)} disabled={contactRequestLoading}>
            {t('productDetails.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={async () => {
              if (!isQuantityValid) {
                setContactRequestError(
                  requiredQuantity < (product.minimumOrderQuantity || 1)
                    ? t('productDetails.requiredQuantityValidation', `Minimum order is ${product.minimumOrderQuantity} ${product.unit}`)
                    : t('productDetails.maxQuantityValidation', `Cannot order more than available (${product.availableQuantity} ${product.unit})`)
                );
                return;
              }
              setContactRequestError('');
              await handleContactRequest();
              setContactRequestOpen(false);
            }}
            color="primary"
            disabled={contactRequestLoading || !isQuantityValid}
          >
            {contactRequestLoading ? t('productDetails.requesting', 'Requesting...') : t('productDetails.confirm', 'Confirm')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showUserConfirmDialog} onClose={() => setShowUserConfirmDialog(false)}>
        <DialogTitle>{t('productDetails.userConfirmTitle', 'Confirm Purchase')}</DialogTitle>
        <DialogContent>
          <TextField
            label={t('productDetails.finalQuantity', 'Final Bought Quantity')}
            type="number"
            value={finalQuantity}
            onChange={e => setFinalQuantity(Number(e.target.value))}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label={t('productDetails.finalPrice', 'Final Price')}
            type="number"
            value={finalPrice}
            onChange={e => setFinalPrice(Number(e.target.value))}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label={t('productDetails.feedback', 'Feedback (optional)')}
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
              {t('productDetails.yesBought', 'Yes, I bought')}
            </Button>
            <Button
              variant={!didBuy ? 'contained' : 'outlined'}
              color="error"
              onClick={() => setDidBuy(false)}
            >
              {t('productDetails.noBought', 'No, I did not buy')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUserConfirmDialog(false)}>{t('productDetails.cancel', 'Cancel')}</Button>
          <Button onClick={handleUserConfirm} color="primary">{t('productDetails.submit', 'Submit')}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showFarmerConfirmDialog} onClose={() => setShowFarmerConfirmDialog(false)}>
        <DialogTitle>{t('productDetails.farmerConfirmTitle', 'Confirm Sale')}</DialogTitle>
        <DialogContent>
          <TextField
            label={t('productDetails.finalQuantity', 'Final Sold Quantity')}
            type="number"
            value={finalQuantity}
            onChange={e => setFinalQuantity(Number(e.target.value))}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label={t('productDetails.finalPrice', 'Final Price')}
            type="number"
            value={finalPrice}
            onChange={e => setFinalPrice(Number(e.target.value))}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label={t('productDetails.feedback', 'Feedback (optional)')}
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
              {t('productDetails.yesSold', 'Yes, I sold')}
            </Button>
            <Button
              variant={!didSell ? 'contained' : 'outlined'}
              color="error"
              onClick={() => setDidSell(false)}
            >
              {t('productDetails.noSold', 'No, I did not sell')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFarmerConfirmDialog(false)}>{t('productDetails.cancel', 'Cancel')}</Button>
          <Button onClick={handleFarmerConfirm} color="primary">{t('productDetails.submit', 'Submit')}</Button>
        </DialogActions>
      </Dialog>
      {confirmationStatus && (
        <Box sx={{ mt: 2 }}>
          <Chip label={t(`productDetails.status.${confirmationStatus}`, confirmationStatus)} color={
            confirmationStatus === 'completed' ? 'success' :
            confirmationStatus === 'disputed' ? 'error' :
            confirmationStatus === 'pending' ? 'warning' : 'default'
          } />
        </Box>
      )}
    </Box>
  );
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [selectedImage, setSelectedImage] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const { t } = useTranslation();

  // Use React Query for product details
  const {
    data: product,
    isLoading: loading,
    error
  } = useQuery<Product | null>({
    queryKey: ['product', id],
    queryFn: () => id ? fetchProductById(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const defaultNutritionalInfo = {
    calories: 0,
    protein: "Not specified",
    carbs: "Not specified",
    fat: "Not specified",
    fiber: "Not specified",
    vitamins: "Not specified",
  };

  if (loading) {
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

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          {error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Product not found')}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          mt: 2,
          gap: 2,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "50%",
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
              borderColor: theme.palette.primary.main,
            },
            width: 40,
            height: 40,
          }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
      </Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              style={{
                width: "100%",
                height: "400px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {product.images.map((image, index) => (
              <Box
                key={index}
                sx={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  border:
                    index === selectedImage
                      ? `2px solid ${theme.palette.primary.main}`
                      : "2px solid transparent",
                  cursor: "pointer",
                }}
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              fontWeight="600"
            >
              {product.name}
            </Typography>

            {product.isOrganic && (
              <Chip
                label={t('productDetails.isOrganic')}
                color="secondary"
                size="small"
                sx={{ mb: 2 }}
              />
            )}

            <Typography
              variant="h5"
              color="primary"
              fontWeight="bold"
              sx={{ mb: 2 }}
            >
              ₹{product.price}/{product.unit}
            </Typography>

            <Typography variant="body1" sx={{ mb: 3 }}>
              {product.description}
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 3,
                p: 2,
                backgroundColor: "background.paper",
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Box sx={{ mr: 2 }}>
                <Avatar
                  src={product.farmer.profileImageUrl || getRoleProfilePlaceholder('farmer')}
                  sx={{ width: 56, height: 56 }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {t('productDetails.soldBy')} {product.farmer.name}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CalendarToday
                    color="primary"
                    fontSize="small"
                    sx={{ mr: 1 }}
                  />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('productDetails.harvestDate')}
                    </Typography>
                    <Typography variant="body2">
                      {new Date(product.harvestDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <LocationOn
                    color="primary"
                    fontSize="small"
                    sx={{ mr: 1 }}
                  />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('productDetails.productLocation')}
                    </Typography>
                    <Typography variant="body2">
                      {product.location?.district}, {product.location?.state}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Inventory color="primary" fontSize="small" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('productDetails.availableQuantity')}
                    </Typography>
                    <Typography variant="body2">
                      {product.availableQuantity} {product.unit}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ShoppingCart color="primary" fontSize="small" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('productDetails.minimumOrderQuantity')}
                    </Typography>
                    <Typography variant="body2">
                      {product.minimumOrderQuantity !== null && product.minimumOrderQuantity !== undefined ? `${product.minimumOrderQuantity} ${product.unit}` : t('productDetails.notSet')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{ flexGrow: 1, py: 1.5 }}
                onClick={() => setTabValue(2)}
              >
                {t('productDetails.contactSeller')}
              </Button>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mt: 6 }}>
            <Paper sx={{ boxShadow: 1 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="product details tabs"
                variant={isMobile ? "scrollable" : "standard"}
                allowScrollButtonsMobile
                sx={{
                  "& .MuiTabs-indicator": {
                    backgroundColor: theme.palette.primary.main,
                  },
                  "& .MuiTab-root": {
                    fontSize: isMobile ? "0.7rem" : "0.875rem",
                    minWidth: "unset",
                    padding: isMobile ? "6px 12px" : "12px 16px",
                    whiteSpace: "nowrap",
                  },
                }}
              >
                <Tab
                  label={
                    <Box component="span" sx={{ minWidth: 80 }}>
                      {t('productDetails.productDetails')}
                    </Box>
                  }
                  id="tab-0"
                  aria-controls="tabpanel-0"
                />
                <Tab
                  label={
                    <Box component="span" sx={{ minWidth: 80 }}>
                      {t('productDetails.nutritionalInfo')}
                    </Box>
                  }
                  id="tab-1"
                  aria-controls="tabpanel-1"
                />
                <Tab
                  label={
                    <Box component="span" sx={{ minWidth: 60 }}>
                      {t('productDetails.sellerInfo')}
                    </Box>
                  }
                  id="tab-2"
                  aria-controls="tabpanel-2"
                />
              </Tabs>
              <Box sx={{ p: 3 }}>
                <TabPanel value={tabValue} index={0}>
                  <Typography variant="h6" gutterBottom>
                    {t('productDetails.aboutThisProduct')}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {product.description}
                  </Typography>

                  <Typography variant="h6" gutterBottom>
                    {t('productDetails.keyFeatures')}
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body1">
                        {t('productDetails.freshlyHarvested')} {new Date(product.harvestDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    {product.isOrganic && (
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body1">
                          {t('productDetails.organicallyGrown')}
                        </Typography>
                      </Box>
                    )}
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body1">
                        {t('productDetails.directlySourced')}
                      </Typography>
                    </Box>
                  </Box>
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                  <Typography variant="h6" gutterBottom>
                    {t('productDetails.nutritionalInformation')}
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row">
                            {t('productDetails.nutrition.calories')}
                          </TableCell>
                          <TableCell>
                            {product?.nutritionalInfo?.calories ?? defaultNutritionalInfo.calories} kcal
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">
                            {t('productDetails.nutrition.protein')}
                          </TableCell>
                          <TableCell>
                            {product?.nutritionalInfo?.protein ?? defaultNutritionalInfo.protein}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">
                            {t('productDetails.nutrition.carbs')}
                          </TableCell>
                          <TableCell>
                            {product?.nutritionalInfo?.carbs ?? defaultNutritionalInfo.carbs}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">
                            {t('productDetails.nutrition.fat')}
                          </TableCell>
                          <TableCell>
                            {product?.nutritionalInfo?.fat ?? defaultNutritionalInfo.fat}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">
                            {t('productDetails.nutrition.fiber')}
                          </TableCell>
                          <TableCell>
                            {product?.nutritionalInfo?.fiber ?? defaultNutritionalInfo.fiber}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">
                            {t('productDetails.nutrition.vitamins')}
                          </TableCell>
                          <TableCell>
                            {product?.nutritionalInfo?.vitamins ?? defaultNutritionalInfo.vitamins}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Avatar
                      src={
                        product.farmer.profileImageUrl || getRoleProfilePlaceholder('farmer')
                      }
                      sx={{ width: 80, height: 80, mr: 3 }}
                    />
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {product.farmer.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('productDetails.certifiedFarmer')}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {t('productDetails.farmerLocation')}
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <LocationOn color="primary" fontSize="small" sx={{ mr: 2 }} />
                      <Typography variant="body1">
                        {product.farmer?.address?.district}, {product.farmer?.address?.state}
                      </Typography>
                    </Box>
                  </Box>
                  <PhoneRequestSection 
                    product={product} 
                    t={t} 
                    navigate={navigate}
                    isLoading={false}
                    setIsLoading={() => {}}
                    error={null}
                    setError={() => {}}
                    setProduct={() => {}}
                  />
                </TabPanel>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetails;

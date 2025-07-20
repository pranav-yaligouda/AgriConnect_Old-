import React, { useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, CircularProgress } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { checkExistingContactRequest, createContactRequest } from '../../services/apiService';
import type { CreateContactRequestResponse } from '../../types/api';

const ContactSellerSection = ({ product }: { product: any }) => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const [contactRequestOpen, setContactRequestOpen] = useState(false);
  const [requiredQuantity, setRequiredQuantity] = useState<number>(product.minimumOrderQuantity || 1);
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [contactRequestError, setContactRequestError] = useState('');

  // Check if user is logged in and not the owner
  const isLoggedIn = !!user;
  const isOwnProduct = user && product.farmer?._id === user._id;

  // Contact request mutation (React Query v5 object syntax, no generics)
  const contactRequestMutation = useMutation({
    mutationFn: (quantity: number) => createContactRequest(product._id, quantity),
    onSuccess: (data: CreateContactRequestResponse) => {
      setHasPendingRequest(true);
      if (data?.existingRequestId && data?.message === 'Request already exists') {
        notify('Contact request already exists', 'info');
      } else {
        notify('Request submitted successfully', 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['product', product._id] });
      setContactRequestOpen(false);
    },
    onError: (error: any) => {
      notify(error?.message || 'Request failed', 'error');
    },
  });

  // Check for existing contact request
  React.useEffect(() => {
    let mounted = true;
    setRequestLoading(true);
    checkExistingContactRequest(product.farmer._id, product._id, Date.now())
      .then(res => { if (mounted) setHasPendingRequest(!!res?.exists); })
      .catch(() => { if (mounted) setHasPendingRequest(false); })
      .finally(() => { if (mounted) setRequestLoading(false); });
    return () => { mounted = false; };
  }, [product.farmer._id, product._id]);

  if (!isLoggedIn) {
    return (
      <Box sx={{ mt: 2 }}>
        <Button variant="outlined" color="primary" href="/login">
          Login to request phone number
        </Button>
      </Box>
    );
  }
  if (isOwnProduct) return null;

  const isQuantityValid = requiredQuantity >= (product.minimumOrderQuantity || 1) && requiredQuantity <= product.availableQuantity;

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="contained"
        color="primary"
        disabled={!!(hasPendingRequest || requestLoading || !product)}
        onClick={() => setContactRequestOpen(true)}
        startIcon={hasPendingRequest ? <CheckCircleIcon /> : undefined}
      >
        {requestLoading ? (
          <CircularProgress size={24} />
        ) : hasPendingRequest ? (
          'Contact Requested'
        ) : (
          'Request Contact'
        )}
      </Button>
      {/* Contact Request Dialog */}
      <Dialog open={contactRequestOpen} onClose={() => setContactRequestOpen(false)}>
        <DialogTitle>Confirm Request</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to send a contact request for this product?<br />
            <b>Minimum Order Quantity: {product.minimumOrderQuantity} {product.unit}</b>
          </Typography>
          <TextField
            label="Required Quantity"
            type="number"
            value={requiredQuantity}
            onChange={e => setRequiredQuantity(Number(e.target.value))}
            inputProps={{ min: product.minimumOrderQuantity || 1, max: product.availableQuantity }}
            fullWidth
            sx={{ mt: 2 }}
            helperText={
              requiredQuantity < (product.minimumOrderQuantity || 1)
                ? `Minimum order is ${product.minimumOrderQuantity} ${product.unit}`
                : requiredQuantity > product.availableQuantity
                  ? `Cannot order more than available (${product.availableQuantity} ${product.unit})`
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
          <Button onClick={() => setContactRequestOpen(false)} disabled={contactRequestMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!isQuantityValid) {
                setContactRequestError(
                  requiredQuantity < (product.minimumOrderQuantity || 1)
                    ? `Minimum order is ${product.minimumOrderQuantity} ${product.unit}`
                    : `Cannot order more than available (${product.availableQuantity} ${product.unit})`
                );
                return;
              }
              setContactRequestError('');
              contactRequestMutation.mutate(requiredQuantity);
            }}
            color="primary"
            disabled={contactRequestMutation.isPending || !isQuantityValid}
          >
            {contactRequestMutation.isPending ? 'Requesting...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactSellerSection; 
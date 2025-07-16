import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Chip, Button, Paper, CircularProgress } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import type { ContactRequest, ApiErrorResponse } from '../../types/api';
import ConfirmDialog from './ConfirmDialog';
import { useMutation } from '@tanstack/react-query';
import { acceptContactRequest, rejectContactRequest, confirmContactRequestAsUser, confirmContactRequestAsFarmer } from '../../services/apiService';
import { useTranslation } from 'react-i18next';

interface ContactRequestAccordionProps {
  request: ContactRequest;
  refetch: () => void;
  userRole: string;
  type: 'sent' | 'received';
}

const ContactRequestAccordion: React.FC<ContactRequestAccordionProps> = ({ request, refetch, userRole, type }) => {
  const { t } = useTranslation('profile');
  const [showUserConfirmDialog, setShowUserConfirmDialog] = useState(false);
  const [showFarmerConfirmDialog, setShowFarmerConfirmDialog] = useState(false);
  const [finalQuantity, setFinalQuantity] = useState<number>(request.requestedQuantity || 1);
  const [finalPrice, setFinalPrice] = useState<string>('');
  const [userFeedback, setUserFeedback] = useState('');
  const [didBuy, setDidBuy] = useState(true);
  const [farmerFeedback, setFarmerFeedback] = useState('');
  const [didSell, setDidSell] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Accept/reject mutations
  const acceptMutation = useMutation({
    mutationFn: () => acceptContactRequest(request._id),
    onMutate: () => setAccepting(true),
    onSuccess: () => { refetch(); setAccepting(false); },
    onError: () => setAccepting(false),
  });
  const rejectMutation = useMutation({
    mutationFn: () => rejectContactRequest(request._id),
    onMutate: () => setRejecting(true),
    onSuccess: () => { refetch(); setRejecting(false); },
    onError: () => setRejecting(false),
  });

  // Confirm as user
  const confirmUserMutation = useMutation({
    mutationFn: () => confirmContactRequestAsUser(request._id, {
      finalQuantity,
      finalPrice: Number(finalPrice),
      didBuy,
      feedback: userFeedback,
    }),
    onMutate: () => setConfirming(true),
    onSuccess: () => { refetch(); setShowUserConfirmDialog(false); setConfirming(false); },
    onError: () => setConfirming(false),
  });
  // Confirm as farmer
  const confirmFarmerMutation = useMutation({
    mutationFn: () => confirmContactRequestAsFarmer(request._id, {
      finalQuantity,
      finalPrice: Number(finalPrice),
      didSell,
      feedback: farmerFeedback,
    }),
    onMutate: () => setConfirming(true),
    onSuccess: () => { refetch(); setShowFarmerConfirmDialog(false); setConfirming(false); },
    onError: () => setConfirming(false),
  });

  // Helper for status color
  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'info';
      case 'completed': return 'success';
      case 'disputed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Accordion sx={{ mb: 2, borderRadius: 2, boxShadow: 1, bgcolor: type === 'sent' ? '#f5f5f5' : '#e3f2fd', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{typeof request.productId === 'object' ? request.productId.name : request.productId}</Typography>
            <Chip label={t(`statuses.${request.status}`)} color={statusColor(request.status)} size="small" sx={{ ml: 1, textTransform: 'capitalize' }} />
          </Box>
          <Typography variant="body2" color="text.secondary">{new Date(request.requestedAt).toLocaleString()}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ mb: 1 }}>
          {typeof request.requestedQuantity !== 'undefined' && (
            <Typography variant="body2">{t('requestedQuantity')}: {request.requestedQuantity}</Typography>
          )}
          {/* Farmer contact info for sent requests */}
          {type === 'sent' && (['accepted', 'completed', 'disputed', 'not_completed', 'expired'].includes(request.status)) && request.farmerId && typeof request.farmerId === 'object' && (
            <Paper variant="outlined" sx={{ mt: 1, mb: 1, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('farmerContactInfo')}:</Typography>
              {request.farmerId.phone && <Typography variant="body2">📞 {request.farmerId.phone}</Typography>}
              {request.farmerId.email && <Typography variant="body2">✉️ {request.farmerId.email}</Typography>}
              {request.farmerId.address && (
                <Typography variant="body2">📍 {request.farmerId.address.street}, {request.farmerId.address.district}, {request.farmerId.address.state}, {request.farmerId.address.zipcode}</Typography>
              )}
            </Paper>
          )}
          {/* Accept/Reject for received requests */}
          {type === 'received' && request.status === 'pending' && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                disabled={accepting}
                onClick={() => acceptMutation.mutate()}
              >
                {accepting ? <CircularProgress size={18} /> : t('accept')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                disabled={rejecting}
                onClick={() => rejectMutation.mutate()}
              >
                {rejecting ? <CircularProgress size={18} /> : t('reject')}
              </Button>
            </Box>
          )}
          {/* Confirm as user */}
          {type === 'sent' && request.status === 'accepted' && !request.userConfirmed && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => {
                setFinalQuantity(request.requestedQuantity || 1);
                setFinalPrice('');
                setShowUserConfirmDialog(true);
              }}
            >
              {t('didYouBuy')}
            </Button>
          )}
          {/* Confirm as farmer */}
          {type === 'received' && request.status === 'accepted' && request.userConfirmed && !request.farmerConfirmed && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => {
                setFinalQuantity(request.finalQuantity || 1);
                setFinalPrice('');
                setShowFarmerConfirmDialog(true);
              }}
            >
              {t('confirmSale')}
            </Button>
          )}
          {/* Status chips */}
          {request.status === 'completed' && (
            <Chip label={t('completed')} color="success" size="small" sx={{ mt: 1 }} />
          )}
          {request.status === 'disputed' && (
            <Chip label={t('disputed')} color="error" size="small" sx={{ mt: 1 }} />
          )}
          {/* Details */}
          {request.finalQuantity && <Typography variant="body2">{t('finalQuantity')}: {request.finalQuantity}</Typography>}
          {request.finalPrice && <Typography variant="body2">{t('finalPrice')}: {request.finalPrice}</Typography>}
          {request.userFeedback && <Typography variant="body2">{t('userFeedback')}: {request.userFeedback}</Typography>}
          {request.farmerFeedback && <Typography variant="body2">{t('farmerFeedback')}: {request.farmerFeedback}</Typography>}
          {request.adminNote && <Typography variant="body2">{t('adminNote')}: {request.adminNote}</Typography>}
        </Box>
        {/* User Confirmation Dialog */}
        <ConfirmDialog
          open={showUserConfirmDialog}
          onClose={() => setShowUserConfirmDialog(false)}
          onSubmit={() => confirmUserMutation.mutate()}
          loading={confirming}
          role="user"
          quantity={finalQuantity}
          setQuantity={setFinalQuantity}
          price={finalPrice}
          setPrice={setFinalPrice}
          feedback={userFeedback}
          setFeedback={setUserFeedback}
          didBuyOrSell={didBuy}
          setDidBuyOrSell={setDidBuy}
        />
        {/* Farmer Confirmation Dialog */}
        <ConfirmDialog
          open={showFarmerConfirmDialog}
          onClose={() => setShowFarmerConfirmDialog(false)}
          onSubmit={() => confirmFarmerMutation.mutate()}
          loading={confirming}
          role="farmer"
          quantity={finalQuantity}
          setQuantity={setFinalQuantity}
          price={finalPrice}
          setPrice={setFinalPrice}
          feedback={farmerFeedback}
          setFeedback={setFarmerFeedback}
          didBuyOrSell={didSell}
          setDidBuyOrSell={setDidSell}
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default ContactRequestAccordion; 
import { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Tabs, Tab, CircularProgress, Box } from "@mui/material";
import ProfileHeader from '../components/profile/ProfileHeader';
import EditProfileDialog from '../components/profile/EditProfileDialog';
import DeleteAccountDialog from '../components/profile/DeleteAccountDialog';
import ProductList from '../components/profile/ProductList';
import ContactRequests from '../components/profile/ContactRequests';
import { fetchMyProducts, fetchMyContactRequests } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { Product, ContactRequest } from '../types/api';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../contexts/NotificationContext';
import React from 'react';

const Profile = () => {
  const { t } = useTranslation();
  const auth = useAuth();
  const user = auth?.user;
  const refreshUser = auth?.refreshUser;
  const loading = auth?.loading;
  const [tabValue, setTabValue] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { notify } = useNotification();

  const { data: products = [], isLoading: productsLoading, isError: productsError, error: productsErrorObj } = useQuery<Product[]>({
    queryKey: ["myProducts", user?._id],
    queryFn: fetchMyProducts,
    enabled: user?.role === "farmer"
  });
  const { data: contactRequests = { sent: [], received: [] }, isError: contactRequestsError, error: contactRequestsErrorObj, refetch: refetchContactRequests } = useQuery<{ sent: ContactRequest[]; received: ContactRequest[] }>({
    queryKey: ["myContactRequests", user?._id],
    queryFn: fetchMyContactRequests,
    enabled: !!user
  });

  // Notify on fetch errors
  React.useEffect(() => {
    if (productsError) {
      notify(t('profile.errorLoadingProducts') || 'Failed to fetch products', 'error');
    }
  }, [productsError, notify, t]);
  React.useEffect(() => {
    if (contactRequestsError) {
      notify(t('profile.errorLoadingContactRequests') || 'Failed to fetch contact requests', 'error');
    }
  }, [contactRequestsError, notify, t]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user || !refreshUser) {
    // Optionally, show a fallback or redirect
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <ProfileHeader
        user={user}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />
      <Paper sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          {user.role === "farmer" && <Tab label={t('profile.productsTab')} />}
          <Tab label={t('profile.contactRequestsTab')} />
        </Tabs>
        {user.role === "farmer" && tabValue === 0 && (
          <ProductList
            products={products}
            loading={productsLoading}
            onView={id => navigate(`/products/${id}`)}
            onDelete={id => {
              setSelectedProductId(id);
              setDeleteOpen(true);
            }}
          />
        )}
        {tabValue === (user.role === "farmer" ? 1 : 0) && (
          <ContactRequests
            contactRequests={contactRequests}
            refetch={refetchContactRequests}
            userRole={user.role}
          />
        )}
      </Paper>
      <EditProfileDialog open={editOpen} onClose={() => setEditOpen(false)} user={user} refreshUser={refreshUser} />
      <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </Container>
  );
};

export default Profile;

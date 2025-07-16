import React from 'react';
import { Box, Typography } from '@mui/material';
import type { ContactRequest } from '../../types/api';
import ContactRequestAccordion from './ContactRequestAccordion';
import { useTranslation } from 'react-i18next';

interface ContactRequestsProps {
  contactRequests: { sent: ContactRequest[]; received: ContactRequest[] };
  refetch: () => void;
  userRole: string;
}

const ContactRequests: React.FC<ContactRequestsProps> = ({ contactRequests, refetch, userRole }) => {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h6" gutterBottom>{t('profile.contactRequestsTab')}</Typography>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>{t('profile.sentRequests')}</Typography>
        {contactRequests.sent.length === 0 ? <Typography>{t('profile.noSentRequests')}</Typography> : (
          contactRequests.sent.map(req => (
            <ContactRequestAccordion key={req._id} request={req} refetch={refetch} userRole={userRole} type="sent" />
          ))
        )}
        {userRole !== 'user' && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>{t('profile.receivedRequests')}</Typography>
            {contactRequests.received.length === 0 ? <Typography>{t('profile.noReceivedRequests')}</Typography> : (
              contactRequests.received.map(req => (
                <ContactRequestAccordion key={req._id} request={req} refetch={refetch} userRole={userRole} type="received" />
              ))
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default ContactRequests; 
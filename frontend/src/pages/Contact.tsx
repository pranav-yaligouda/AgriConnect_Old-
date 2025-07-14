import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Email,
  Facebook,
  Instagram,
  LinkedIn,
  Phone,
  Support,
  Twitter,
  X,
} from '@mui/icons-material';
import { containerPadding, paperStyle, formElementStyles } from '../utils/styleUtils';
import { useTranslation } from 'react-i18next';

const Contact = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container maxWidth="xl" sx={{ ...containerPadding }}>
      {/* Hero Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          {t('contact.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          {t('contact.description')}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Contact Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...paperStyle, height: '100%', p: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                {t('contact.get_in_touch')}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {t('contact.have_questions')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Email color="primary" sx={{ mr: 2, fontSize: 30 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('contact.email')}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  connect.agriconnect@gmail.com
                </Typography>
              </Box>
            </Box>


            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <LinkedIn color="primary" sx={{ mr: 2, fontSize: 30 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('contact.linkedin')}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  agri-connect
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Facebook color="primary" sx={{ mr: 2, fontSize: 30 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('contact.facebook')}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  Agri Connect
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Twitter color="primary" sx={{ mr: 2, fontSize: 30 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('contact.twitter')}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  @AgriConncet
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Contact Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ ...paperStyle, p: 4 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              {t('contact.send_us_a_message')}
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('contact.name')}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    sx={formElementStyles.textField}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('contact.email')}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    sx={formElementStyles.textField}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('contact.subject')}
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    sx={formElementStyles.textField}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('contact.message')}
                    name="message"
                    multiline
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    sx={formElementStyles.textField}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 4,
                      fontWeight: 'bold',
                    }}
                  >
                    {t('contact.send_message')}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Contact; 
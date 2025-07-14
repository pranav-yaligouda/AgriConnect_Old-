import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ExpandMore,
  QuestionAnswer,
  Support,
  Security,
} from '@mui/icons-material';
import { containerPadding, paperStyle } from '../utils/styleUtils';
import { useTranslation } from 'react-i18next';

const FAQ = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState<string | false>(false);
  const { t } = useTranslation('faq');

  // Dynamically get all categories and questions
  const categories = t('categories', { returnObjects: true });

  // Only include non-admin categories
  const filteredCategories = Object.fromEntries(
    Object.entries(categories).filter(([catKey]) => catKey !== 'admin')
  );

  // Optional: icon mapping for categories
  const iconMap: Record<string, React.ReactNode> = {
    general: <QuestionAnswer color="primary" sx={{ fontSize: 30, mr: 2 }} />,
    support: <Support color="primary" sx={{ fontSize: 30, mr: 2 }} />,
  };

  return (
    <Container maxWidth="xl" sx={{ ...containerPadding }}>
      {/* Hero Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          {t('title')}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          {t('intro')}
        </Typography>
      </Box>

      {/* FAQ Categories */}
      <Grid container spacing={4}>
        {Object.entries(filteredCategories).map(([catKey, catValue]: any, index) => (
          <Grid item xs={12} md={6} key={catKey}>
            <Paper sx={{ ...paperStyle, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {iconMap[catKey]}
                <Typography variant="h5" fontWeight="bold">
                  {catValue.title}
                </Typography>
              </Box>
              {Object.entries(catValue.questions).map(([qKey, qVal]: any, qIndex) => {
                if (qKey.endsWith('-answer')) return null;
                const answerKey = `${qKey}-answer`;
                return (
                  <Accordion
                    key={qKey}
                    expanded={expanded === `panel-${catKey}-${qKey}`}
                    onChange={(_e, isExp) => setExpanded(isExp ? `panel-${catKey}-${qKey}` : false)}
                    sx={{
                      mb: 2,
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="medium">
                        {qVal}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">
                        {catValue.questions[answerKey]}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Additional Support Section */}
      <Paper sx={{ ...paperStyle, mt: 6, p: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            {t('additional-support.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('additional-support.text')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              borderRadius: 2,
              py: 1.5,
              px: 4,
              fontWeight: 'bold',
            }}
            href="/contact"
          >
            {t('additional-support.button')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default FAQ;
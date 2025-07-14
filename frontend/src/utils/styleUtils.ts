// Shared styling constants and utility functions for consistency across the app

// Container padding based on screen size
export const containerPadding = { py: 4 };

// Card styling for consistency
export const cardStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 2,
  overflow: 'hidden',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: 6,
  }
};

// Paper styling for consistency
export const paperStyle = {
  borderRadius: 2,
  p: 2,
};

// Button styling variations
export const buttonStyles = {
  rounded: {
    borderRadius: 20,
    fontWeight: 'medium',
  },
  primary: {
    color: '#fff',
    bgcolor: '#2E7D32',
    '&:hover': {
      bgcolor: '#1B5E20',
    }
  },
};

// Grid spacing
export const gridSpacing = 2;

// Typography styles
export const typographyStyles = {
  ellipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  }
};

// Form element styling
export const formElementStyles = {
  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
    }
  }
}; 
import React from 'react';
import { Box, Pagination } from '@mui/material';

interface MarketplacePaginationProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  isMobile?: boolean;
}

const MarketplacePagination: React.FC<MarketplacePaginationProps> = ({ currentPage, pageCount, onPageChange, isMobile }) => {
  if (pageCount <= 1) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 1 }}>
      <Pagination
        count={pageCount}
        page={currentPage}
        onChange={onPageChange}
        color="primary"
        siblingCount={isMobile ? 0 : 1}
        boundaryCount={0}
        shape="rounded"
        size={isMobile ? 'medium' : 'large'}
        aria-label="pagination"
      />
    </Box>
  );
};

export default MarketplacePagination; 
import React, { useState, useEffect } from "react";
import { Container, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';

import { fetchProducts, fetchCategories } from "../services/apiService";
import type { Product, PaginatedProducts } from '../types/api';

import { useTranslation } from "react-i18next";
import { useNotification } from '../contexts/NotificationContext';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import MarketplaceHero from '../components/marketplace/MarketplaceHero';
import MarketplaceFilterBar from '../components/marketplace/MarketplaceFilterBar';
import MarketplaceMobileFilterDrawer from '../components/marketplace/MarketplaceMobileFilterDrawer';
import MarketplaceSelectedFilters from '../components/marketplace/MarketplaceSelectedFilters';
import MarketplaceProductGrid from '../components/marketplace/MarketplaceProductGrid';
import MarketplaceEmptyState from '../components/marketplace/MarketplaceEmptyState';
import MarketplacePagination from '../components/marketplace/MarketplacePagination';


const Marketplace: React.FC = () => {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { t } = useTranslation('marketplace');
  const { notify } = useNotification();
  
  // State

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = isTablet ? 6 : 12;

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);


  // Fetch categories
  const {
    data: categoriesRaw,
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery<string[], Error>({

    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000
  });

  const categories: string[] = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  // Fetch products
  const {
    data: productsDataRaw,
    isLoading: productsLoading,
    error: productsError
  } = useQuery<PaginatedProducts, Error>({

    queryKey: [
      'products',
      debouncedSearchQuery,
      selectedCategories.join(','),
      selectedDistrict,
      organicOnly,
      sortBy,
      currentPage,
      productsPerPage,
    ],
    queryFn: () => fetchProducts({
          search: debouncedSearchQuery,
      category: selectedCategories.includes('all') || selectedCategories.length === 0 ? undefined : selectedCategories.join(','),
          district: selectedDistrict,

      ...(organicOnly ? { isOrganic: true } : {}),
          sort: sortBy,
          page: currentPage,
      limit: productsPerPage,
    }),

    staleTime: 60 * 1000
  });
  const productsData: PaginatedProducts = productsDataRaw && Array.isArray(productsDataRaw.products)
    ? productsDataRaw
    : { products: [], total: 0, page: 1, pageCount: 1 };

  useEffect(() => {
    if (categoriesError) notify(t('errorLoadingCategories'), 'error');
  }, [categoriesError, notify, t]);
  useEffect(() => {
    if (productsError) notify(t('errorLoadingProducts'), 'error');
  }, [productsError, notify, t]);

  const products: Product[] = productsData.products;
  const totalProducts: number = productsData.total;
  const pageCount: number = productsData.pageCount;


  // Unique districts from products
  const uniqueDistricts: string[] = Array.from(
    new Set((products || []).map((product: Product) => product.location?.district).filter((district: string | undefined): district is string => district !== undefined))
  ).sort();

  // Handlers
  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) => {
      if (category === "all") {
        return ["all"];
      }
      if (prev.includes(category)) {
        return prev.filter((cat) => cat !== category);
      }
      const newCategories = [...prev.filter((cat) => cat !== "all"), category];
      return newCategories;
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSortBy(event.target.value as string);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setOrganicOnly(false);
    setSearchQuery("");
    setSelectedDistrict("");
  };

  // Selected filters handlers
  const handleCategoryDelete = (category: string) => handleCategoryChange(category);
  const handleOrganicDelete = () => setOrganicOnly(false);
  const handleSearchDelete = () => setSearchQuery("");
  const handleDistrictDelete = () => setSelectedDistrict("");

  // View details handler
  const handleViewDetails = (id: string) => navigate(`/products/${id}`);

  // Loading and error states
  if (productsLoading || categoriesLoading) return <LoadingSpinner />;
  if (productsError || categoriesError) return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <MarketplaceEmptyState error />
      </Container>
  );

  return (
    <ErrorBoundary>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <MarketplaceHero />
      {/* Mobile Filter Button */}
      {isMobile && (
          <Container sx={{ mb: 2, px: 2 }} maxWidth={false} disableGutters>
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              style={{ width: '100%', padding: '1rem', borderRadius: 8, fontSize: '1rem', border: '1px solid #1976d2', background: 'white', color: '#1976d2', cursor: 'pointer' }}
              aria-label={t('filterProducts')}
            >
              {t('filterProducts')}
            </button>
          </Container>
        )}
        {/* Desktop Filter Bar */}
        <MarketplaceFilterBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          categories={categories}
          selectedDistrict={selectedDistrict}
          onDistrictChange={setSelectedDistrict}
          uniqueDistricts={uniqueDistricts}
          organicOnly={organicOnly}
          onOrganicChange={setOrganicOnly}
        />
        {/* Selected Filters */}
        <MarketplaceSelectedFilters
          selectedCategories={selectedCategories}
          onCategoryDelete={handleCategoryDelete}
          organicOnly={organicOnly}
          onOrganicDelete={handleOrganicDelete}
          searchQuery={searchQuery}
          onSearchDelete={handleSearchDelete}
          selectedDistrict={selectedDistrict}
          onDistrictDelete={handleDistrictDelete}
        />
        {/* Product Grid or Empty State */}
        {products.length > 0 ? (
          <MarketplaceProductGrid products={products} onViewDetails={handleViewDetails} />
        ) : (
          <MarketplaceEmptyState onResetFilters={handleClearFilters} />
        )}
          {/* Pagination */}
        <MarketplacePagination
          currentPage={currentPage}
          pageCount={pageCount}
          onPageChange={handlePageChange}
          isMobile={isMobile}
        />
      {/* Mobile Filter Drawer */}
        <MarketplaceMobileFilterDrawer
        open={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          uniqueDistricts={uniqueDistricts}
          selectedDistrict={selectedDistrict}
          onDistrictChange={setSelectedDistrict}
          organicOnly={organicOnly}
          onOrganicChange={setOrganicOnly}
          onClearFilters={handleClearFilters}
        />
    </Container>
    </ErrorBoundary>
  );
};

export default Marketplace;

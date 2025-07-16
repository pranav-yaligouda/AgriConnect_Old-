import './i18n';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';

// Core components (static imports)
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import PrivateRoute from './components/PrivateRoute';
import LoadingSpinner from './components/LoadingSpinner';
import RoleBasedDashboardRoute from './components/RoleBasedDashboardRoute';

// Lazy-loaded components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ManageProducts = lazy(() => import('./pages/ManageProducts'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQ = lazy(() => import('./pages/FAQ'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Context providers
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationWidget from './components/NotificationWidget';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: { main: '#2E7D32', light: '#4CAF50', dark: '#1B5E20' },
    secondary: { main: '#FFA000', light: '#FFB300', dark: '#FF8F00' },
    background: { default: '#F5F5F5', paper: '#FFFFFF' },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 600 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.75rem', fontWeight: 500 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontWeight: 500 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } } },
    MuiContainer: {
      styleOverrides: {
        root: { padding: '0 16px', '@media (min-width:600px)': { padding: '0 24px' } }
      }
    },
    MuiPaper: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiCardContent: {
      styleOverrides: { root: { padding: 16, '&:last-child': { paddingBottom: 16 } } }
    },
    MuiCardMedia: { styleOverrides: { root: { borderRadius: '8px 8px 0 0' } } },
  },
  spacing: 8,
  breakpoints: { values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1536 } }
});

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <SocketProvider token={null}>
                <Router>
                  <div className="app">
                    <Navbar />
                    <main className="main-content">
                      <Routes>
                        <Route path="/" element={<Home />} />

                        <Route path="/marketplace" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Marketplace />
                          </Suspense>
                        }/>

                        <Route path="/products/:id" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <ProductDetails />
                          </Suspense>
                        }/>

                        <Route element={<PrivateRoute />}>
                          <Route path="/profile" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Profile />
                            </Suspense>
                          }/>
                          <Route path="/dashboard" element={<RoleBasedDashboardRoute />} />
                          <Route path="/my-products" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <ManageProducts />
                            </Suspense>
                          }/>
                        </Route>

                        <Route path="/login" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Login />
                          </Suspense>
                        }/>

                        <Route path="/register" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Register />
                          </Suspense>
                        }/>

                        <Route path="/about" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <About />
                          </Suspense>
                        }/>

                        <Route path="/contact" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Contact />
                          </Suspense>
                        }/>

                        <Route path="/faq" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <FAQ />
                          </Suspense>
                        }/>

                        <Route path="/admin" element={<AdminLogin />} />
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />

                        <Route path="*" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <ErrorPage />
                          </Suspense>
                        }/>
                      </Routes>
                    </main>
                    <Footer />
                    <NotificationWidget />
                  </div>
                </Router>
                <ToastContainer 
                  position="bottom-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                />
              </SocketProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
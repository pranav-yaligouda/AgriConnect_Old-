import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper, CircularProgress, AppBar, Toolbar, IconButton, Button } from '@mui/material';
import { fetchAdminUsers, fetchAdminProducts, fetchAdminLogs, fetchAdminSettings } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const tabLabels = ['Users', 'Products', 'Logs', 'Settings'];

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    setError('');
    setLoading(true);
    const fetchData = async () => {
      try {
        if (tab === 0) {
          const res = await fetchAdminUsers();
          setUsers(res.data || []);
        } else if (tab === 1) {
          const res = await fetchAdminProducts();
          setProducts(res.data || []);
        } else if (tab === 2) {
          const res = await fetchAdminLogs();
          setLogs(res.data || []);
        } else if (tab === 3) {
          const res = await fetchAdminSettings();
          setSettings(res.data || {});
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      <AppBar position="static" color="primary" sx={{ mb: 2 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
            Admin Dashboard
          </Typography>
          <Button color="inherit" onClick={() => { localStorage.removeItem('token'); navigate('/admin'); }}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Paper sx={{ maxWidth: 600, mx: 'auto', mt: 2, borderRadius: 3, p: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          {tabLabels.map((label, idx) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
        <Box sx={{ mt: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" align="center">{error}</Typography>
          ) : (
            <>
              {tab === 0 && (
                <Box>
                  <Typography variant="h6" mb={2}>All Users</Typography>
                  {users.length === 0 ? <Typography>No users found.</Typography> : (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {users.map((u: any) => (
                        <Paper key={u._id} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
                          <Typography fontWeight="bold">{u.name} ({u.role})</Typography>
                          <Typography variant="body2">Email: {u.email}</Typography>
                          <Typography variant="body2">Phone: {u.phone}</Typography>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
              {tab === 1 && (
                <Box>
                  <Typography variant="h6" mb={2}>All Products</Typography>
                  {products.length === 0 ? <Typography>No products found.</Typography> : (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {products.map((p: any) => (
                        <Paper key={p._id} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
                          <Typography fontWeight="bold">{p.name}</Typography>
                          <Typography variant="body2">Farmer: {p.farmer?.name || p.farmer}</Typography>
                          <Typography variant="body2">Price: ₹{p.price} / {p.unit}</Typography>
                          <Typography variant="body2">Available: {p.availableQuantity}</Typography>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
              {tab === 2 && (
                <Box>
                  <Typography variant="h6" mb={2}>Activity Logs</Typography>
                  {logs.length === 0 ? <Typography>No logs found.</Typography> : (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {logs.map((log: any, idx: number) => (
                        <Paper key={idx} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
                          <Typography fontWeight="bold">{log.action}</Typography>
                          <Typography variant="body2">User: {log.user}</Typography>
                          <Typography variant="body2">Resource: {log.resource}</Typography>
                          <Typography variant="body2">At: {new Date(log.timestamp || log.createdAt).toLocaleString()}</Typography>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
              {tab === 3 && (
                <Box>
                  <Typography variant="h6" mb={2}>Settings</Typography>
                  <pre style={{ fontSize: 14, background: '#f8f8f8', padding: 8, borderRadius: 4 }}>{JSON.stringify(settings, null, 2)}</pre>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminDashboard; 
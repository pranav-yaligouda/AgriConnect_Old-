import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper, CircularProgress, AppBar, Toolbar, IconButton, Button, TextField, InputAdornment, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Select } from '@mui/material';
import { fetchAdminUsers, fetchAdminProducts, fetchAdminLogs, fetchAdminSettings, createAdmin, changeUserRole, updateAdminNotes, fetchAdminContactRequests } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { toast } from 'react-toastify';

const tabLabels = ['Users', 'Products', 'Contact Requests', 'Logs', 'Settings'];
const roleOptions = ['user', 'farmer', 'vendor', 'admin'];

function CreateAdminDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '', address: { street: '', district: '', state: '', zipcode: '' } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      setForm(f => ({ ...f, address: { ...f.address, [name.split('.')[1]]: value } }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await createAdmin(form);
      toast.success('Admin created successfully!');
      onCreated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Admin</DialogTitle>
      <DialogContent>
        <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Username" name="username" value={form.username} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Street" name="address.street" value={form.address.street} onChange={handleChange} fullWidth margin="normal" />
        <TextField label="District" name="address.district" value={form.address.district} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="State" name="address.state" value={form.address.state} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Zipcode" name="address.zipcode" value={form.address.zipcode} onChange={handleChange} fullWidth margin="normal" />
        {error && <Typography color="error">{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">Create</Button>
      </DialogActions>
    </Dialog>
  );
}

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(10);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userTotal, setUserTotal] = useState(0);
  const [productPage, setProductPage] = useState(1);
  const [productLimit, setProductLimit] = useState(10);
  const [productSearch, setProductSearch] = useState('');
  const [productTotal, setProductTotal] = useState(0);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [editNotesUser, setEditNotesUser] = useState<any>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editNotesLoading, setEditNotesLoading] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState<any>(null);
  const [editRole, setEditRole] = useState('');
  const [editRoleLoading, setEditRoleLoading] = useState(false);
  const [contactRequests, setContactRequests] = useState<any[]>([]);
  const [contactRequestPage, setContactRequestPage] = useState(1);
  const [contactRequestLimit, setContactRequestLimit] = useState(10);
  const [contactRequestSearch, setContactRequestSearch] = useState('');
  const [contactRequestStatus, setContactRequestStatus] = useState('');
  const [contactRequestTotal, setContactRequestTotal] = useState(0);
  const navigate = useNavigate();

  const refreshUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminUsers({ page: userPage, limit: userLimit, search: userSearch, role: userRoleFilter });
      setUsers(res.data?.users || res.users || []);
      setUserTotal(res.data?.total || res.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };
  const refreshProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminProducts({ page: productPage, limit: productLimit, search: productSearch });
      setProducts(res.data?.products || res.products || []);
      setProductTotal(res.data?.total || res.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };
  const refreshContactRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminContactRequests({ page: contactRequestPage, limit: contactRequestLimit, search: contactRequestSearch, status: contactRequestStatus });
      setContactRequests(res.data?.requests || res.requests || []);
      setContactRequestTotal(res.data?.total || res.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch contact requests');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setError('');
    setLoading(true);
    const fetchData = async () => {
      try {
        if (tab === 0) {
          await refreshUsers();
        } else if (tab === 1) {
          await refreshProducts();
        } else if (tab === 2) {
          await refreshContactRequests();
        } else if (tab === 3) {
          const res = await fetchAdminLogs();
          setLogs(res.data?.logs || res.logs || []);
        } else if (tab === 4) {
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
    // eslint-disable-next-line
  }, [tab, userPage, userLimit, userSearch, userRoleFilter, productPage, productLimit, productSearch, contactRequestPage, contactRequestLimit, contactRequestSearch, contactRequestStatus]);

  // Pagination helpers
  const userPageCount = Math.ceil(userTotal / userLimit);
  const productPageCount = Math.ceil(productTotal / productLimit);
  const contactRequestPageCount = Math.ceil(contactRequestTotal / contactRequestLimit);

  // Handlers for admin notes
  const handleEditNotes = (user: any) => {
    setEditNotesUser(user);
    setEditNotes(user.adminNotes || '');
  };
  const handleSaveNotes = async () => {
    setEditNotesLoading(true);
    try {
      await updateAdminNotes(editNotesUser._id, editNotes);
      toast.success('Admin notes updated');
      setEditNotesUser(null);
      refreshUsers();
    } catch (err) {
      toast.error('Failed to update notes');
    } finally {
      setEditNotesLoading(false);
    }
  };
  // Handlers for role change
  const handleEditRole = (user: any) => {
    setEditRoleUser(user);
    setEditRole(user.role);
  };
  const handleSaveRole = async () => {
    setEditRoleLoading(true);
    try {
      await changeUserRole(editRoleUser._id, editRole);
      toast.success('Role updated');
      setEditRoleUser(null);
      refreshUsers();
    } catch (err) {
      toast.error('Failed to update role');
    } finally {
      setEditRoleLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      <AppBar position="static" color="primary" sx={{ mb: 2 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')}> <ArrowBackIcon /> </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}> Admin Dashboard </Typography>
          <Button color="inherit" onClick={() => { localStorage.removeItem('token'); navigate('/admin'); }}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Paper sx={{ maxWidth: 900, mx: 'auto', mt: 2, borderRadius: 3, p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" indicatorColor="primary" textColor="primary">
          {tabLabels.map((label, idx) => (<Tab key={label} label={label} />))}
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
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <TextField placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
                    <Select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} displayEmpty size="small" sx={{ minWidth: 120 }}>
                      <MenuItem value="">All Roles</MenuItem>
                      {roleOptions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </Select>
                    <Button variant="contained" color="primary" onClick={() => setCreateAdminOpen(true)}>Create New Admin</Button>
                  </Box>
                  <Typography variant="h6" mb={2}>All Users</Typography>
                  {users.length === 0 ? <Typography>No users found.</Typography> : (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {users.map((u: any) => (
                        <Paper key={u._id} sx={{ p: 2, mb: 1, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography fontWeight="bold">{u.name} ({u.role})</Typography>
                            <Typography variant="body2">Email: {u.email}</Typography>
                            <Typography variant="body2">Phone: {u.phone}</Typography>
                            <Typography variant="body2">Admin Notes: {u.adminNotes || '-'} <Button size="small" onClick={() => handleEditNotes(u)}>Edit</Button></Typography>
                          </Box>
                          <Box>
                            <Button size="small" onClick={() => handleEditRole(u)}>Change Role</Button>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>Prev</Button>
                    <Typography>Page {userPage} of {userPageCount || 1}</Typography>
                    <Button disabled={userPage >= userPageCount} onClick={() => setUserPage(p => p + 1)}>Next</Button>
                  </Box>
                </Box>
              )}
              {tab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <TextField placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
                  </Box>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button disabled={productPage <= 1} onClick={() => setProductPage(p => p - 1)}>Prev</Button>
                    <Typography>Page {productPage} of {productPageCount || 1}</Typography>
                    <Button disabled={productPage >= productPageCount} onClick={() => setProductPage(p => p + 1)}>Next</Button>
                  </Box>
                </Box>
              )}
              {tab === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <TextField placeholder="Search contact requests..." value={contactRequestSearch} onChange={e => setContactRequestSearch(e.target.value)} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
                    <Select value={contactRequestStatus} onChange={e => setContactRequestStatus(e.target.value)} displayEmpty size="small" sx={{ minWidth: 140 }}>
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="accepted">Accepted</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="disputed">Disputed</MenuItem>
                      <MenuItem value="expired">Expired</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </Box>
                  <Typography variant="h6" mb={2}>All Contact Requests</Typography>
                  {contactRequests.length === 0 ? <Typography>No contact requests found.</Typography> : (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {contactRequests.map((cr: any) => (
                        <Paper key={cr._id} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
                          <Typography fontWeight="bold">Product: {cr.productId?.name || '-'}</Typography>
                          <Typography variant="body2">Requester: {cr.requesterId?.name || '-'} ({cr.requesterId?.role || '-'})</Typography>
                          <Typography variant="body2">Farmer: {cr.farmerId?.name || '-'} ({cr.farmerId?.role || '-'})</Typography>
                          <Typography variant="body2">Status: {cr.status}</Typography>
                          <Typography variant="body2">Requested Quantity: {cr.requestedQuantity}</Typography>
                          <Typography variant="body2">Requested At: {cr.requestedAt ? new Date(cr.requestedAt).toLocaleString() : '-'}</Typography>
                          <Typography variant="body2">User Confirmed: {cr.userConfirmed ? 'Yes' : 'No'}</Typography>
                          <Typography variant="body2">Farmer Confirmed: {cr.farmerConfirmed ? 'Yes' : 'No'}</Typography>
                          <Typography variant="body2">Final Quantity (User): {cr.finalQuantity !== undefined ? cr.finalQuantity : '-'}</Typography>
                          <Typography variant="body2">Final Price (User): {cr.finalPrice !== undefined ? cr.finalPrice : '-'}</Typography>
                          <Typography variant="body2">Final Quantity (Farmer): {cr.farmerFinalQuantity !== undefined ? cr.farmerFinalQuantity : '-'}</Typography>
                          <Typography variant="body2">Final Price (Farmer): {cr.farmerFinalPrice !== undefined ? cr.farmerFinalPrice : '-'}</Typography>
                        </Paper>
                      ))}
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button disabled={contactRequestPage <= 1} onClick={() => setContactRequestPage(p => p - 1)}>Prev</Button>
                    <Typography>Page {contactRequestPage} of {contactRequestPageCount || 1}</Typography>
                    <Button disabled={contactRequestPage >= contactRequestPageCount} onClick={() => setContactRequestPage(p => p + 1)}>Next</Button>
                  </Box>
                </Box>
              )}
              {tab === 3 && (
                <Box>
                  <Typography variant="h6" mb={2}>Activity Logs</Typography>
                  {logs.length === 0 ? <Typography>No logs found.</Typography> : (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {logs.map((log: any, idx: number) => (
                        <Paper key={idx} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
                          <Typography fontWeight="bold">{log.action}</Typography>
                          <Typography variant="body2">Admin: {log.admin?.username || '-'}</Typography>
                          <Typography variant="body2">Target: {log.target || '-'}</Typography>
                          <Typography variant="body2">At: {new Date(log.createdAt).toLocaleString()}</Typography>
                          <Typography variant="body2">Details: <pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(log.details, null, 2)}</pre></Typography>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
              {tab === 4 && (
                <Box>
                  <Typography variant="h6" mb={2}>Settings</Typography>
                  <pre style={{ fontSize: 14, background: '#f8f8f8', padding: 8, borderRadius: 4 }}>{JSON.stringify(settings, null, 2)}</pre>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>
      <CreateAdminDialog open={createAdminOpen} onClose={() => setCreateAdminOpen(false)} onCreated={refreshUsers} />
      {/* Edit Admin Notes Dialog */}
      <Dialog open={!!editNotesUser} onClose={() => setEditNotesUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Admin Notes</DialogTitle>
        <DialogContent>
          <TextField label="Admin Notes" value={editNotes} onChange={e => setEditNotes(e.target.value)} fullWidth multiline minRows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNotesUser(null)} disabled={editNotesLoading}>Cancel</Button>
          <Button onClick={handleSaveNotes} disabled={editNotesLoading} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      {/* Edit Role Dialog */}
      <Dialog open={!!editRoleUser} onClose={() => setEditRoleUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <Select value={editRole} onChange={e => setEditRole(e.target.value)} fullWidth>
            {roleOptions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRoleUser(null)} disabled={editRoleLoading}>Cancel</Button>
          <Button onClick={handleSaveRole} disabled={editRoleLoading} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard; 
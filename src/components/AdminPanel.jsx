import { useState, useEffect } from "react";
import { useToast } from "./Toast";
import { Users } from "lucide-react";

const AdminPanel = ({ dataProvider }) => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [settingsData, usersData] = await Promise.all([
          dataProvider.getAdminSettings(),
          dataProvider.getAllUsers()
        ]);
        setSettings(settingsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        addToast('Failed to load admin data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [dataProvider, addToast]);

  const updateSetting = async (key, value) => {
    try {
      await dataProvider.updateAdminSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      addToast('Setting updated successfully', 'success');
    } catch (error) {
      console.error('Error updating setting:', error);
      addToast('Failed to update setting', 'error');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await dataProvider.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      addToast('User role updated successfully', 'success');
    } catch (error) {
      console.error('Error updating user role:', error);
      addToast('Failed to update user role', 'error');
    }
  };

  const SettingsTab = () => (
    <div className="row">
      <div className="col-lg-6">
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Company Settings</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-control"
                value={settings.company_name || ''}
                onChange={(e) => updateSetting('company_name', e.target.value)}
                onBlur={(e) => updateSetting('company_name', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Default Customer Status</label>
              <select
                className="form-select"
                value={settings.default_customer_status || 'Prospect'}
                onChange={(e) => updateSetting('default_customer_status', e.target.value)}
              >
                <option value="Prospect">Prospect</option>
                <option value="Qualified">Qualified</option>
                <option value="Active">Active</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-lg-6">
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">System Configuration</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Supported Industries</label>
              <textarea
                className="form-control"
                rows="4"
                value={JSON.stringify(settings.supported_industries || [], null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    updateSetting('supported_industries', parsed);
                  } catch (err) {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder='["Technology", "Healthcare", "Finance"]'
              />
              <small className="form-text text-muted">
                JSON array of supported industries
              </small>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Customer Statuses</label>
              <textarea
                className="form-control"
                rows="3"
                value={JSON.stringify(settings.customer_statuses || [], null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    updateSetting('customer_statuses', parsed);
                  } catch (err) {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder='["Prospect", "Qualified", "Active"]'
              />
              <small className="form-text text-muted">
                JSON array of available customer statuses
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">User Management</h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="customer-avatar me-2">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-semibold">{user.email}</div>
                        <small className="text-muted">ID: {user.id.slice(0, 8)}...</small>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={user.role || 'user'}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => {/* View user details */}}
                    >
                      View
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to deactivate this user?')) {
                          // Deactivate user logic
                        }
                      }}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Admin Panel</h1>
          <p className="text-muted mb-0">Manage system settings and users</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} className="me-1" />
            Users
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'settings' ? <SettingsTab /> : <UsersTab />}
    </div>
  );
};

export default AdminPanel;
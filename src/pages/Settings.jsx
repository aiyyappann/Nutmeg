import { useState } from "react";
import { useAppContext } from "../App";
import { useToast } from "../components/Toast";

const Settings = () => {
  const { mockMode, toggleMockMode, settings, updateSettings } = useAppContext();
  const { addToast } = useToast();
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(formData);
    setSaved(true);
    addToast('Settings saved successfully', 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 mb-1">Settings</h1>
        <p className="text-muted mb-0">Configure your CRM preferences</p>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Application Settings</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Page Size</label>
                    <select
                      className="form-select"
                      name="pageSize"
                      value={formData.pageSize}
                      onChange={handleInputChange}
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Theme</label>
                    <select
                      className="form-select"
                      name="theme"
                      value={formData.theme}
                      onChange={handleInputChange}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">API Endpoint</label>
                  <input
                    type="url"
                    className="form-control"
                    name="apiEndpoint"
                    value={formData.apiEndpoint}
                    onChange={handleInputChange}
                    placeholder="https://api.nutmegcrm.com"
                  />
                  <small className="form-text text-muted">
                    Base URL for API requests when not in mock mode
                  </small>
                </div>

                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary">
                    {saved ? 'Saved!' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Data Mode</h5>
            </div>
            <div className="card-body">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="mockModeSwitch"
                  checked={mockMode}
                  onChange={toggleMockMode}
                />
                <label className="form-check-label" htmlFor="mockModeSwitch">
                  <strong>Mock Mode</strong>
                </label>
              </div>
              <small className="text-muted">
                {mockMode 
                  ? "Currently using local mock data. Toggle off to use live API." 
                  : "Currently using live API. Toggle on to use mock data for testing."
                }
              </small>
              
              <div className="mt-3 p-3 bg-light rounded">
                <div className="d-flex align-items-center mb-2">
                  <strong>Mock Mode Benefits</strong>
                </div>
                <ul className="list-unstyled mb-0 small">
                  <li>• Works offline</li>
                  <li>• No API rate limits</li>
                  <li>• Safe for testing</li>
                  <li>• Fast development</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">System Info</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="small text-muted">Version</div>
                <div>NutMeg CRM v1.0.0</div>
              </div>
              <div className="mb-3">
                <div className="small text-muted">Last Updated</div>
                <div>{new Date().toLocaleDateString()}</div>
              </div>
              <div className="mb-3">
                <div className="small text-muted">Environment</div>
                <div>{mockMode ? 'Mock' : 'Production'}</div>
              </div>
              <div className="mb-0">
                <div className="small text-muted">Browser</div>
                <div>{navigator.userAgent.split(' ')[0]}</div>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Help & Support</h6>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <a href="#" className="list-group-item list-group-item-action border-0 px-0">
                  User Guide
                </a>
                <a href="#" className="list-group-item list-group-item-action border-0 px-0">
                  Video Tutorials
                </a>
                <a href="#" className="list-group-item list-group-item-action border-0 px-0">
                  Contact Support
                </a>
                <a href="#" className="list-group-item list-group-item-action border-0 px-0">
                  Report Bug
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
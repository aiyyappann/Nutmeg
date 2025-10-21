import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../App";
import { useToast } from "../components/Toast"; // Import useToast

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { dataProvider } = useAppContext();
  const { addToast } = useToast(); // Get the addToast function
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    status: 'Prospect',
    value: 0,
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    tags: []
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      const fetchCustomer = async () => {
        setLoading(true);
        try {
          const customer = await dataProvider.getCustomer(id);
          if (customer) {
            setFormData(customer);
          }
        } catch (error) {
          console.error('Error fetching customer:', error);
          addToast('Failed to load customer data', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [id, isEditing, dataProvider, addToast]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.company.trim()) newErrors.company = 'Company is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      if (isEditing) {
        await dataProvider.updateCustomer(id, formData);
        addToast('Customer updated successfully', 'success'); // Add toast for update
      } else {
        await dataProvider.createCustomer(formData);
        addToast('Customer created successfully', 'success'); // Add toast for create
      }
      navigate('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
      addToast(`Error: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
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
          <h1 className="h3 mb-1">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h1>
          <p className="text-muted mb-0">
            {isEditing ? 'Update customer information' : 'Enter customer details'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate('/customers')}
        >
          ← Back to Customers
        </button>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                    {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                    {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-8">
                    <label className="form-label">Company *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.company ? 'is-invalid' : ''}`}
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                    />
                    {errors.company && <div className="invalid-feedback">{errors.company}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Industry</label>
                    <select
                      className="form-select"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Education">Education</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Media">Media</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Prospect">Prospect</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Customer Value (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="value"
                      value={formData.value}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Tags</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter tags separated by commas (e.g., VIP, Enterprise, Lead)"
                    value={formData.tags.join(', ')}
                    onChange={handleTagsChange}
                  />
                  <small className="form-text text-muted">Separate multiple tags with commas</small>
                </div>

                <h5 className="mb-3">Address</h5>
                <div className="row mb-3">
                  <div className="col-12">
                    <label className="form-label">Street Address</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-4">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">ZIP Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address.zip"
                      value={formData.address.zip}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/customers')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Saving...
                      </>
                    ) : (
                      <>{isEditing ? 'Update' : 'Create'} Customer</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Tips</h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <small>• Fill in all required fields marked with *</small>
                </li>
                <li className="mb-2">
                  <small>• Use a valid email address for notifications</small>
                </li>
                <li className="mb-2">
                  <small>• Tags help organize and segment customers</small>
                </li>
                <li className="mb-0">
                  <small>• Customer value helps prioritize relationships</small>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
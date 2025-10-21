// export default NewTicketModal;
import { useState, useEffect } from "react";
import { useToast } from "./Toast";
import { useAppContext } from "../App"; // Import useAppContext
import { X } from "lucide-react";

const NewTicketModal = ({ isOpen, onClose, onTicketCreated }) => {
  const { addToast } = useToast();
  const { dataProvider } = useAppContext(); // Get dataProvider from context
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customer_id: '',
    category: 'General',
    priority: 'Medium',
    assigned_to: 'Support Team'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const { data } = await dataProvider.getCustomers(1, 1000); // Fetch all customers
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      addToast('Failed to load customers', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.customer_id) return;

    setLoading(true);
    try {
      const ticketData = {
        title: formData.title,
        description: formData.description,
        customerId: formData.customer_id,
        category: formData.category,
        priority: formData.priority,
        assignedTo: formData.assigned_to,
        status: 'Open'
      };
      await dataProvider.createTicket(ticketData);

      addToast('Ticket created successfully', 'success');
      onTicketCreated();
      handleClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
      addToast('Failed to create ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      customer_id: '',
      category: 'General',
      priority: 'Medium',
      assigned_to: 'Support Team'
    });
    onClose();
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create New Ticket</h5>
            <button type="button" className="btn-close" onClick={handleClose}>
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Customer *</label>
                  <select
                    className="form-select"
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName} ({customer.company})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="General">General</option>
                    <option value="Feature Request">Feature Request</option>
                  </select>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Assigned To</label>
                  <input
                    type="text"
                    className="form-control"
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    placeholder="Support Team"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description of the issue or request"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewTicketModal;
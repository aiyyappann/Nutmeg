import { useState, useEffect } from "react";
import { useToast } from "../components/Toast";
import { useAppContext } from "../App";
import Pagination from "../components/Pagination";
import { Plus, Phone, Mail, Users, MessageCircle, Share2 } from "lucide-react";

const Interactions = () => {
  const { addToast } = useToast();
  const { dataProvider } = useAppContext();
  const [interactions, setInteractions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    type: 'Email',
    channel: 'Website', // Default channel updated
    subject: '',
    notes: '',
    outcome: '',
    duration: '',
    next_action: ''
  });
  
  useEffect(() => {
    fetchInteractions();
    fetchCustomers();
  }, [currentPage]);

  const fetchCustomers = async () => {
    try {
      const { data } = await dataProvider.getCustomers(1, 1000);
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const { data, totalPages: newTotalPages } = await dataProvider.getInteractions(null, currentPage, 10);
      setInteractions(data);
      setTotalPages(newTotalPages);
    } catch (error) {
      console.error('Error fetching interactions:', error);
      addToast('Failed to load interactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const interactionData = {
        customerId: formData.customer_id,
        type: formData.type,
        channel: formData.channel,
        subject: formData.subject,
        notes: formData.notes,
        outcome: formData.outcome,
        duration: formData.duration ? parseInt(formData.duration) : null,
        nextAction: formData.next_action
      };

      if (selectedInteraction) {
        await dataProvider.updateInteraction(selectedInteraction.id, interactionData);
        addToast('Interaction updated successfully', 'success');
      } else {
        await dataProvider.createInteraction(interactionData);
        addToast('Interaction created successfully', 'success');
      }
      
      fetchInteractions();
      setShowForm(false);
      setSelectedInteraction(null);
      setFormData({
        customer_id: '',
        type: 'Email',
        channel: 'Website',
        subject: '',
        notes: '',
        outcome: '',
        duration: '',
        next_action: ''
      });
    } catch (error) {
      console.error('Error saving interaction:', error);
      addToast('Failed to save interaction', 'error');
    }
  };

  const handleEdit = (interaction) => {
    setSelectedInteraction(interaction);
    setFormData({
      customer_id: interaction.customerId,
      type: interaction.type,
      channel: interaction.channel,
      subject: interaction.subject,
      notes: interaction.notes,
      outcome: interaction.outcome,
      duration: interaction.duration?.toString() || '',
      next_action: interaction.nextAction
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this interaction?')) {
      try {
        await dataProvider.deleteInteraction(id);
        setInteractions(prev => prev.filter(int => int.id !== id));
        addToast('Interaction deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting interaction:', error);
        addToast('Failed to delete interaction', 'error');
      }
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      'Phone': Phone,
      'Email': Mail,
      'Meeting': Users,
      'Chat': MessageCircle,
    };
    return icons[type] || MessageCircle;
  };

  const getOutcomeBadge = (outcome) => {
    const classes = {
      'Positive': 'bg-success',
      'Neutral': 'bg-secondary',
      'Negative': 'bg-danger'
    };
    return (
      <span className={`badge ${classes[outcome] || 'bg-secondary'}`}>
        {outcome}
      </span>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Customer Interactions</h1>
          <p className="text-muted mb-0">Track all customer touchpoints and communications</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} className="me-1" />
          Add Interaction
        </button>
      </div>

      {showForm && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedInteraction ? 'Edit Interaction' : 'Add New Interaction'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedInteraction(null);
                    setFormData({
                      customer_id: '',
                      type: 'Email',
                      channel: 'Website',
                      subject: '',
                      notes: '',
                      outcome: '',
                      duration: '',
                      next_action: ''
                    });
                  }}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Customer</label>
                        <select
                          className="form-select"
                          value={formData.customer_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                          required
                        >
                          <option value="">Select Customer</option>
                          {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                              {customer.firstName} {customer.lastName} - {customer.company}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Type</label>
                        <select
                          className="form-select"
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="Email">Email</option>
                          <option value="Phone">Phone</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Chat">Chat</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Channel</label>
                        <select
                          className="form-select"
                          value={formData.channel}
                          onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                        >
                          <option value="Website">Website</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="In-Person">In-Person</option>
                          <option value="Video Call">Video Call</option>
                          <option value="Voice Call">Voice Call</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Subject of the interaction"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Detailed notes about the interaction"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Outcome</label>
                        <select
                          className="form-select"
                          value={formData.outcome}
                          onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
                        >
                          <option value="">Select Outcome</option>
                          <option value="Positive">Positive</option>
                          <option value="Neutral">Neutral</option>
                          <option value="Negative">Negative</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Duration (minutes)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.duration}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                          placeholder="Duration in minutes"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Next Action</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.next_action}
                          onChange={(e) => setFormData(prev => ({ ...prev, next_action: e.target.value }))}
                          placeholder="Next action required"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedInteraction(null);
                      setFormData({
                        customer_id: '',
                        type: 'Email',
                        channel: 'Website',
                        subject: '',
                        notes: '',
                        outcome: '',
                        duration: '',
                        next_action: ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {selectedInteraction ? 'Update Interaction' : 'Create Interaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Interactions Timeline */}
      {loading ? (
        <div className="d-flex justify-content-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : interactions.length === 0 ? (
        <div className="text-center p-5">
          <h4>No interactions found</h4>
          <p className="text-muted mb-4">Start tracking customer interactions to build better relationships</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            Add First Interaction
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="interaction-timeline">
              {interactions.map(interaction => (
                <div key={interaction.id} className="interaction-item border-bottom pb-3 mb-3">
                  <div className="row align-items-start">
                    <div className="col-md-8">
                      <div className="d-flex align-items-center mb-2">
                        <div className="me-2 p-2 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ minWidth: "32px", height: "32px" }}>
                          {(() => {
                            const IconComponent = getTypeIcon(interaction.type);
                            return <IconComponent size={16} className="text-primary" />;
                          })()}
                        </div>
                        <div>
                          <strong>{interaction.subject}</strong>
                          <div className="text-muted small">
                            Customer: {interaction.customerName} • {interaction.type} via {interaction.channel}
                          </div>
                        </div>
                      </div>
                      <p className="text-muted mb-2">{interaction.notes}</p>
                      <div className="d-flex align-items-center gap-3">
                        {interaction.outcome && getOutcomeBadge(interaction.outcome)}
                        {interaction.duration && (
                          <small className="text-muted">
                            Duration: {interaction.duration} minutes
                          </small>
                        )}
                        {interaction.nextAction && (
                          <small className="text-primary">
                            Next: {interaction.nextAction}
                          </small>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4 text-end">
                      <div className="text-muted small">
                        {new Date(interaction.date).toLocaleDateString()} at{' '}
                        {new Date(interaction.date).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="mt-2">
                        <button 
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(interaction)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(interaction.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default Interactions;


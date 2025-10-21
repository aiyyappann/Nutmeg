import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppContext } from "../App";
import { Headphones } from "lucide-react";
import ActivityTimeline from '../components/ActivityTimeline';

const CustomerDetail = () => {
  const { id } = useParams();
  const { dataProvider } = useAppContext();
  const [customer, setCustomer] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [customerData, interactionsData, ticketsData] = await Promise.all([
          dataProvider.getCustomer(id),
          dataProvider.getInteractions(id, 1, 5),
          dataProvider.getTickets(1, 5, { customerId: id })
        ]);
        
        setCustomer(customerData);
        setInteractions(interactionsData.data);
        setTickets(ticketsData.data);
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, dataProvider]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center p-5">
        <h4>Customer not found</h4>
        <Link to="/customers" className="btn btn-primary">Back to Customers</Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Active': 'bg-success',
      'Inactive': 'bg-secondary',
      'Prospect': 'bg-warning text-dark',
      'Qualified': 'bg-info'
    };
    
    return (
      <span className={`badge ${statusClasses[status] || 'bg-secondary'}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">{customer.firstName} {customer.lastName}</h1>
          <p className="text-muted mb-0">{customer.email} • {customer.company}</p>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/customers/${id}/edit`} className="btn btn-outline-primary">
            ✏️ Edit
          </Link>
          <Link to="/customers" className="btn btn-outline-secondary">
            ← Back
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'interactions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('interactions')}
                  >
                    Interactions ({interactions.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'tickets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tickets')}
                  >
                    Support ({tickets.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activity')}
                  >
                    Activity
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {activeTab === 'overview' && (
                <div>
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6 className="text-muted mb-3">Contact Information</h6>
                      <div className="mb-2">
                        <strong>Email:</strong> {customer.email}
                      </div>
                      <div className="mb-2">
                        <strong>Phone:</strong> {customer.phone || 'Not provided'}
                      </div>
                      <div className="mb-2">
                        <strong>Address:</strong><br />
                        {customer.address.street}<br />
                        {customer.address.city}, {customer.address.state} {customer.address.zip}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-muted mb-3">Business Information</h6>
                      <div className="mb-2">
                        <strong>Company:</strong> {customer.company}
                      </div>
                      <div className="mb-2">
                        <strong>Industry:</strong> {customer.industry}
                      </div>
                      <div className="mb-2">
                        <strong>Value:</strong> ₹{customer.value.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {customer.tags && customer.tags.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-muted mb-2">Tags</h6>
                      <div className="d-flex flex-wrap gap-1">
                        {customer.tags.map(tag => (
                          <span key={tag} className="badge bg-light text-dark border">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'interactions' && (
                <div>
                  {interactions.length === 0 ? (
                    <div className="text-center p-4">
                      <p className="text-muted">No interactions yet</p>
                    </div>
                  ) : (
                    <div className="interaction-timeline">
                      {interactions.map(interaction => (
                        <div key={interaction.id} className="interaction-item">
                          <div className="d-flex justify-content-between">
                            <div>
                              <strong>{interaction.type}</strong> via {interaction.channel}
                              <div className="text-muted small">{interaction.subject}</div>
                            </div>
                            <small className="text-muted">
                              {new Date(interaction.date).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tickets' && (
                <div>
                  {tickets.length === 0 ? (
                    <div className="text-center p-4">
                      <div className="mb-3">
                        <Headphones size={48} className="text-muted" />
                      </div>
                      <p className="text-muted">No support tickets</p>
                    </div>
                  ) : (
                    <div>
                      {tickets.map(ticket => (
                        <div key={ticket.id} className="border-bottom pb-3 mb-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>{ticket.title}</strong>
                              <div className="text-muted small">{ticket.description}</div>
                            </div>
                            <div className="text-end">
                              <span className={`badge bg-${ticket.priority === 'High' ? 'danger' : ticket.priority === 'Medium' ? 'warning' : 'info'}`}>
                                {ticket.priority}
                              </span>
                              <div className="small text-muted mt-1">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
  <div className="p-4">
    {/* If you want global activity
    <ActivityTimeline /> */}

    {/* Or if you want user-specific activity */}
    <ActivityTimeline userId={customer.id} />
  </div>
)}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">Quick Stats</h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6">
                  <div className="text-primary fw-bold h4">{interactions.length}</div>
                  <small className="text-muted">Interactions</small>
                </div>
                <div className="col-6">
                  <div className="text-primary fw-bold h4">{tickets.length}</div>
                  <small className="text-muted">Support Tickets</small>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Customer Details</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="small text-muted">Status</div>
                {getStatusBadge(customer.status)}
              </div>
              <div className="mb-3">
                <div className="small text-muted">Customer Since</div>
                <div>{new Date(customer.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="mb-3">
                <div className="small text-muted">Last Contact</div>
                <div>{new Date(customer.lastContact).toLocaleDateString()}</div>
              </div>
              <div className="mb-0">
                <div className="small text-muted">Customer Value</div>
                <div className="text-primary fw-bold">₹{customer.value.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
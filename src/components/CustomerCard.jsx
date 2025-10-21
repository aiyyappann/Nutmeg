import { Link } from "react-router-dom";

const CustomerCard = ({ customer, onDelete }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

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
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <div className="customer-avatar me-3">
              {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
            </div>
            <div>
              <h6 className="card-title mb-0">
                {customer.firstName} {customer.lastName}
              </h6>
              <small className="text-muted">{customer.email}</small>
            </div>
          </div>
          {getStatusBadge(customer.status)}
        </div>
        
        <div className="mb-3">
          <div className="small text-muted mb-1">Company</div>
          <div className="fw-semibold">{customer.company}</div>
        </div>
        
        <div className="mb-3">
          <div className="small text-muted mb-1">Industry</div>
          <div>{customer.industry}</div>
        </div>
        
        <div className="row mb-3">
          <div className="col-6">
            <div className="small text-muted mb-1">Value</div>
            <div className="fw-semibold text-primary">₹{customer.value.toLocaleString()}</div>
          </div>
          <div className="col-6">
            <div className="small text-muted mb-1">Last Contact</div>
            <div className="small">{formatDate(customer.lastContact)}</div>
          </div>
        </div>
        
        {customer.tags && customer.tags.length > 0 && (
          <div className="mb-3">
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
      
      <div className="card-footer bg-transparent">
        <div className="btn-group w-100">
          <Link 
            to={`/customers/${customer.id}`}
            className="btn btn-outline-primary btn-sm"
          >
            View
          </Link>
          <Link 
            to={`/customers/${customer.id}/edit`}
            className="btn btn-outline-secondary btn-sm"
          >
            Edit
          </Link>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => onDelete(customer.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerCard;
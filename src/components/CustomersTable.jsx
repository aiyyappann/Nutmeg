import { Link } from "react-router-dom";

const CustomersTable = ({ customers, onDelete }) => {
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
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            <th>Customer</th>
            <th>Company</th>
            <th>Industry</th>
            <th>Status</th>
            <th>Value</th>
            <th>Last Contact</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer.id}>
              <td>
                <div className="d-flex align-items-center">
                  <div className="customer-avatar me-3">
                    {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="fw-semibold">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <small className="text-muted">{customer.email}</small>
                  </div>
                </div>
              </td>
              <td>{customer.company}</td>
              <td>{customer.industry}</td>
              <td>{getStatusBadge(customer.status)}</td>
              <td>₹{customer.value.toLocaleString()}</td>
              <td>{formatDate(customer.lastContact)}</td>
              <td className="text-center">
                <div className="btn-group btn-group-sm">
                   <Link 
                     to={`/customers/${customer.id}`}
                     className="btn btn-outline-primary"
                     title="View Details"
                   >
                     View
                   </Link>
                   <Link 
                     to={`/customers/${customer.id}/edit`}
                     className="btn btn-outline-secondary"
                     title="Edit"
                   >
                     Edit
                   </Link>
                   <button
                     className="btn btn-outline-danger"
                     onClick={() => onDelete(customer.id)}
                     title="Delete"
                   >
                     Delete
                   </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomersTable;
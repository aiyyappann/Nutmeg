import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../App";
import { useToast } from "../components/Toast";
import SearchInput from "../components/SearchInput";
import FilterPanel from "../components/FilterPanel";
import CustomersTable from "../components/CustomersTable";
import CustomerCard from "../components/CustomerCard";
import Pagination from "../components/Pagination";
import ImportModal from "../components/ImportModal";
import { Plus, Download, Upload, List, Grid, Users } from "lucide-react";

const Customers = () => {
  const { dataProvider, settings } = useAppContext();
  const { addToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({});
  const [showImportModal, setShowImportModal] = useState(false);

  const filterOptions = {
    status: ['Prospect', 'Qualified', 'Active', 'Inactive'/*, 'Churned'*/],
    industry: ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Other']
  };

  const fetchCustomers = useMemo(() => async () => {
    setLoading(true);
    try {
      const response = await dataProvider.getCustomers(
        currentPage,
        settings.pageSize,
        searchTerm,
        filters
      );
      setCustomers(response.data);
      setTotalPages(response.totalPages);
      setTotalCustomers(response.total);
    } catch (error) {
      console.error('Error fetching customers:', error);
      addToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [dataProvider, currentPage, settings.pageSize, searchTerm, filters, addToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await dataProvider.deleteCustomer(customerId);
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        setTotalCustomers(prev => prev - 1);
        addToast('Customer deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting customer:', error);
        addToast('Failed to delete customer', 'error');
      }
    }
  };
const formatCsvCell = (value) => {
  let str = String(value === null || value === undefined ? '' : value);
  str = str.replace(/"/g, '""'); // Escape any existing double quotes
  return `"${str}"`; // Enclose every value in double quotes
};

// This is your function, now with error handling
const exportCustomers = () => {
  try {
    // --- ADDED ERROR CHECK ---
    if (!customers || customers.length === 0) {
      addToast('No customer data to export.', 'info');
      return;
    }
    // --- END ADDED CHECK ---

    const headers = [
      'id', 'firstName', 'lastName', 'email', 'phone', 'company', 
      'industry', 'status', 'value', 'createdAt', 'updatedAt', 
      'lastContact', 'tags', 'address_street', 'address_city', 
      'address_state', 'address_zip'
    ];

    const csvContent = [
      headers.join(','), 
      ...customers.map(customer => [
        formatCsvCell(customer.id),
        formatCsvCell(customer.firstName),
        formatCsvCell(customer.lastName),
        formatCsvCell(customer.email),
        formatCsvCell(customer.phone),
        formatCsvCell(customer.company),
        formatCsvCell(customer.industry),
        formatCsvCell(customer.status),
        formatCsvCell(customer.value),
        formatCsvCell(customer.createdAt ? new Date(customer.createdAt).toISOString() : ''),
        formatCsvCell(customer.updatedAt ? new Date(customer.updatedAt).toISOString() : ''),
        formatCsvCell(customer.lastContact ? new Date(customer.lastContact).toISOString() : ''),
        formatCsvCell(customer.tags ? customer.tags.join('; ') : ''),
        formatCsvCell(customer.address?.street),
        formatCsvCell(customer.address?.city),
        formatCsvCell(customer.address?.state),
        formatCsvCell(customer.address?.zip)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-t;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    // This is the success message
    addToast('Customer data exported successfully', 'success');

  } catch (error) {
    // --- ADDED ERROR HANDLING ---
    console.error("Failed to export customers:", error);
    // This is the error message toast
    addToast('An error occurred during the export.', 'error');
    // --- END ADDED HANDLING ---
  }
};

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Customers</h1>
          <p className="text-muted mb-0">Manage your customer relationships</p>
        </div>
        <Link to="/customers/new" className="btn btn-primary d-flex align-items-center">
          <Plus size={16} className="me-1" />
          Add Customer
        </Link>
      </div>

      {/* Controls */}
      <div className="row mb-4 align-items-center">
        <div className="col-md-4">
          <SearchInput
            placeholder="Search customers..."
            onSearch={handleSearch}
            value={searchTerm}
          />
        </div>
        <div className="col-md-6">
          <FilterPanel
            filters={filters}
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
          />
        </div>
        <div className="col-md-2 text-end">
          <div className="btn-group" role="group">
            <button
              className={`btn btn-sm btn-outline-secondary ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={14} />
            </button>
            <button
              className={`btn btn-sm btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted">
          {loading ? 'Loading...' : `${totalCustomers} customers found`}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center" onClick={exportCustomers}>
            <Download size={14} className="me-1" />
            Export
          </button>
          <button 
            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
            onClick={() => setShowImportModal(true)}
          >
            <Upload size={14} className="me-1" />
            Import
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="d-flex justify-content-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center p-5">
          <div className="mb-3 d-flex justify-content-center">
            <Users size={48} className="text-muted" />
          </div>
          <h4>No customers found</h4>
          <p className="text-muted mb-4">
            {searchTerm || Object.keys(filters).length > 0
              ? "Try adjusting your search or filters"
              : "Get started by adding your first customer"
            }
          </p>
          {!searchTerm && Object.keys(filters).length === 0 && (
            <Link to="/customers/new" className="btn btn-primary">
              Add First Customer
            </Link>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <CustomersTable
              customers={customers}
              onDelete={handleDeleteCustomer}
            />
          ) : (
            <div className="row">
              {customers.map(customer => (
                <div key={customer.id} className="col-lg-4 col-md-6 mb-4">
                  <CustomerCard
                    customer={customer}
                    onDelete={handleDeleteCustomer}
                  />
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          setShowImportModal(false);
          fetchCustomers();
        }}
        dataProvider={dataProvider}
      />
    </div>
  );
};

export default Customers;
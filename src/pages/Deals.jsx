import { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import { useToast } from '../components/Toast';
import { Plus } from 'lucide-react';

const Deals = () => {
    const { dataProvider } = useAppContext();
    const { addToast } = useToast();
    const [stages, setStages] = useState([]);
    const [deals, setDeals] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Added for better error feedback
    const [showModal, setShowModal] = useState(false);
    const [newDeal, setNewDeal] = useState({
        title: '',
        value: '',
        customer_id: '',
        stage_id: 1, // Default to the first stage
        expected_close_date: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [stagesData, dealsData, customersResponse] = await Promise.all([
                    dataProvider.getDealStages(),
                    dataProvider.getDeals(),
                    dataProvider.getCustomers(1, 1000) // Fetch all customers for the dropdown
                ]);

                setStages(stagesData);
                setDeals(dealsData);
                
                // --- Enhanced Debugging and Data Handling ---
                console.log("API Response for Customers:", customersResponse);

                // Check if the response itself is the array
                if (Array.isArray(customersResponse)) {
                    console.log("Setting customers directly from array response.");
                    setCustomers(customersResponse);
                } 
                // Otherwise, check for a .data property
                else if (customersResponse && Array.isArray(customersResponse.data)) {
                    console.log("Setting customers from response.data property.");
                    setCustomers(customersResponse.data);
                } 
                // Handle unexpected format
                else {
                    console.error("Customer data is not in the expected array format:", customersResponse);
                    setCustomers([]); // Set to empty array to prevent errors
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                setError('Failed to load deal data. See console for details.'); // Set error state
                addToast('Failed to load deal data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dataProvider, addToast]);
    
    const handleDragStart = (e, dealId) => {
        e.dataTransfer.setData("dealId", dealId);
    };

    const handleDrop = async (e, stageId) => {
        const dealId = e.dataTransfer.getData("dealId");
        
        const originalDeals = [...deals];
        const updatedDeals = deals.map(deal =>
            deal.id === dealId ? { ...deal, stage_id: stageId } : deal
        );
        setDeals(updatedDeals);

        try {
            await dataProvider.updateDealStage(dealId, stageId);
            addToast('Deal stage updated!', 'success');
        } catch (error) {
            addToast('Failed to update deal stage', 'error');
            setDeals(originalDeals);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewDeal(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateDeal = async (e) => {
        e.preventDefault();
        if (!newDeal.title || !newDeal.value || !newDeal.customer_id) {
            addToast('Please fill out all required fields.', 'error');
            return;
        }
        try {
            const createdDealWithCustomer = await dataProvider.createDeal(newDeal);
            
            const customer = customers.find(c => c.id === createdDealWithCustomer.customer_id);
            const displayDeal = {
                ...createdDealWithCustomer,
                first_name: customer?.first_name,
                last_name: customer?.last_name
            };

            setDeals(prev => [...prev, displayDeal]);
            addToast('Deal created successfully', 'success');
            setShowModal(false);
            setNewDeal({ title: '', value: '', customer_id: '', stage_id: 1, expected_close_date: '' });
        } catch (error)
        {
            addToast('Failed to create deal', 'error');
        }
    };

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>...Loading</div>;
    }
    
    if (error) {
         return <div className="alert alert-danger">{error}</div>
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1">Sales Pipeline</h1>
                    <p className="text-muted mb-0">Manage your deals through the sales process.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} className="me-1" /> New Deal
                </button>
            </div>

            <div className="d-flex flex-nowrap overflow-auto pb-3" style={{ gap: '1rem' }}>
                {stages.map(stage => (
                    <div key={stage.id} className="flex-shrink-0" style={{ width: '300px' }} onDrop={(e) => handleDrop(e, stage.id)} onDragOver={handleDragOver}>
                        <div className="card h-100">
                            <div className="card-header bg-light">
                                <h6 className="mb-0">{stage.name}</h6>
                            </div>
                            <div className="card-body" style={{ minHeight: '400px', maxHeight: '75vh', overflowY: 'auto' }}>
                                {deals.filter(deal => deal.stage_id === stage.id).map(deal => (
                                    <div key={deal.id} className="card mb-2" draggable onDragStart={(e) => handleDragStart(e, deal.id)}>
                                        <div className="card-body p-2">
                                            <div className="fw-bold">{deal.title}</div>
                                            <div className="small text-muted">{deal.first_name} {deal.last_name}</div>
                                            <div className="small text-success">₹{parseFloat(deal.value).toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Add Deal Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Deal</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleCreateDeal}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="title" className="form-label">Deal Title</label>
                                        <input type="text" className="form-control" id="title" name="title" value={newDeal.title} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="value" className="form-label">Value (₹)</label>
                                        <input type="number" className="form-control" id="value" name="value" value={newDeal.value} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="customer_id" className="form-label">Customer</label>
                                        <select 
                                            className="form-select" 
                                            id="customer_id" 
                                            name="customer_id" 
                                            value={newDeal.customer_id} 
                                            onChange={handleInputChange} 
                                            required 
                                            disabled={customers.length === 0}
                                            style={{ color: newDeal.customer_id ? 'black' : 'grey' }}
                                        >
                                            <option value="">
                                                {customers.length > 0 ? "Select a customer" : "No customers available"}
                                            </option>
                                            {customers.map(customer => (
                                                <option key={customer.id} value={customer.id} style={{ color: 'black' }}>
                                                    {customer.first_name} {customer.last_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                     <div className="mb-3">
                                        <label htmlFor="stage_id" className="form-label">Stage</label>
                                        <select className="form-select" id="stage_id" name="stage_id" value={newDeal.stage_id} onChange={handleInputChange} required>
                                            {stages.map(stage => (
                                                <option key={stage.id} value={stage.id}>{stage.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="expected_close_date" className="form-label">Expected Close Date</label>
                                        <input type="date" className="form-control" id="expected_close_date" name="expected_close_date" value={newDeal.expected_close_date} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                    <button type="submit" className="btn btn-primary">Create Deal</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Deals;


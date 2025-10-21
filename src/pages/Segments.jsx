// export default Segments;
import { useState, useEffect } from "react";
import { useToast } from "../components/Toast";
import { useAppContext } from "../App"; // Import useAppContext
import { Download } from "lucide-react";

const Segments = () => {
  const { addToast } = useToast();
  const { dataProvider } = useAppContext(); // Get the dataProvider from context
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showBuilder, setShowBuilder] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: "",
    rules: [{ field: "status", operator: "eq", value: "" }]
  });

  const fieldOptions = [
    { value: "status", label: "Status" },
    { value: "industry", label: "Industry" },
    { value: "value", label: "Customer Value" },
    { value: "createdAt", label: "Created Date" }
  ];

  const operatorOptions = [
    { value: "eq", label: "equals" },
    { value: "ne", label: "not equals" },
    { value: "gt", label: "greater than" },
    { value: "lt", label: "less than" },
    { value: "contains", label: "contains" }
  ];

  const addRule = () => {
    setNewSegment(prev => ({
      ...prev,
      rules: [...prev.rules, { field: "status", operator: "eq", value: "" }]
    }));
  };

  const removeRule = (index) => {
    setNewSegment(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const updateRule = (index, field, value) => {
    setNewSegment(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const data = await dataProvider.getSegments();
      setSegments(data);
    } catch (error) {
      console.error('Error fetching segments:', error);
      addToast('Failed to load segments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSegment = async () => {
    if (!newSegment.name.trim()) return;

    try {
      const segmentData = {
        name: newSegment.name,
        description: `Segment with ${newSegment.rules.length} rule${newSegment.rules.length !== 1 ? 's' : ''}`,
        criteria: { rules: newSegment.rules }
      };
      const newSegmentWithId = await dataProvider.createSegment(segmentData);
      setSegments(prev => [newSegmentWithId, ...prev]);
      setNewSegment({ name: "", rules: [{ field: "status", operator: "eq", value: "" }] });
      setShowBuilder(false);
      addToast('Segment created successfully', 'success');
    } catch (error) {
      console.error('Error creating segment:', error);
      addToast('Failed to create segment', 'error');
    }
  };

  const deleteSegment = async (id) => {
    if (window.confirm('Are you sure you want to delete this segment?')) {
      try {
        await dataProvider.deleteSegment(id);
        setSegments(prev => prev.filter(s => s.id !== id));
        addToast('Segment deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting segment:', error);
        addToast('Failed to delete segment', 'error');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Customer Segments</h1>
          <p className="text-muted mb-0">Create and manage customer segments</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowBuilder(true)}
        >
          Create Segment
        </button>
      </div>

      {/* Segment Builder Modal */}
      {showBuilder && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Segment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowBuilder(false)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Segment Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newSegment.name}
                    onChange={(e) => setNewSegment(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter segment name"
                  />
                </div>

                <h6 className="mb-3">Rules</h6>
                {newSegment.rules.map((rule, index) => (
                  <div key={index} className="row mb-3 align-items-center">
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={rule.field}
                        onChange={(e) => updateRule(index, 'field', e.target.value)}
                      >
                        {fieldOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={rule.operator}
                        onChange={(e) => updateRule(index, 'operator', e.target.value)}
                      >
                        {operatorOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        value={rule.value}
                        onChange={(e) => updateRule(index, 'value', e.target.value)}
                        placeholder="Value"
                      />
                    </div>
                    <div className="col-md-2">
                      {newSegment.rules.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeRule(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mb-3"
                  onClick={addRule}
                >
                  Add Rule
                </button>

                <div className="alert alert-info">
                  <strong>Preview:</strong> This segment will include customers where {newSegment.rules.length > 1 ? 'all of these conditions are met' : 'this condition is met'}.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBuilder(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveSegment}
                  disabled={!newSegment.name.trim()}
                >
                  Create Segment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segments List */}
      {loading ? (
        <div className="d-flex justify-content-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : segments.length === 0 ? (
        <div className="text-center p-5">
          <h4>No segments created yet</h4>
          <p className="text-muted mb-4">Create your first customer segment to organize your customer base</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowBuilder(true)}
          >
            Create First Segment
          </button>
        </div>
      ) : (
        <div className="row">
          {segments.map(segment => (
            <div key={segment.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title">{segment.name}</h5>
                    <div className="dropdown">
                      <button
                        className="btn btn-sm btn-outline-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                      >
                        ⋮
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <button className="dropdown-item" onClick={() => deleteSegment(segment.id)}>
                            🗑️ Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-primary fw-bold h3">{segment.count}</div>
                    <small className="text-muted">customers match this segment</small>
                  </div>

                  <div className="mb-3">
                    <h6 className="small text-muted mb-2">RULES</h6>
                    {segment.rules.map((rule, index) => (
                      <div key={index} className="small mb-1">
                        <span className="badge bg-light text-dark">
                          {fieldOptions.find(f => f.value === rule.field)?.label} {' '}
                          {operatorOptions.find(o => o.value === rule.operator)?.label} {' '}
                          "{rule.value}"
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <small className="text-muted">
                      Created {new Date(segment.created_at).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <div className="card-footer bg-transparent">
                  <button className="btn btn-outline-primary btn-sm w-100">
                    <Download size={14} className="me-1" />
                    Export Customers
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Segments;
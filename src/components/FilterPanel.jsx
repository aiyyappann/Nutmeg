import { useState } from "react";

const FilterPanel = ({ filters, filterOptions, onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="d-flex align-items-center gap-2">
      {filterOptions && Object.entries(filterOptions).map(([key, options]) => 
        key ? (
        <select
          key={key}
          className="form-select form-select-sm"
          value={activeFilters[key] || ''}
          onChange={(e) => handleFilterChange(key, e.target.value)}
          style={{ minWidth: "120px" }}
        >
          <option value="">{key.charAt(0).toUpperCase() + key.slice(1)}</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        ) : null
      )}
      
      {hasActiveFilters && (
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={clearAllFilters}
          title="Clear all filters"
        >
          ✕ Clear
        </button>
      )}
      
      {hasActiveFilters && (
        <div className="d-flex filter-chips">
          {Object.entries(activeFilters).map(([key, value]) => (
            <span key={key} className="filter-chip">
              {key}: {value}
              <button
                className="btn-close"
                onClick={() => handleFilterChange(key, '')}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
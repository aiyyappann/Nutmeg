import { useState, useEffect } from "react";
import { Search } from "lucide-react";

const SearchInput = ({ placeholder = "Search...", onSearch, value = "", delay = 300 }) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue !== value) {
        onSearch(inputValue);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [inputValue, delay, onSearch, value]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  return (
    <div className="position-relative">
      <input
        type="text"
        className="form-control search-input"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        style={{ 
          paddingLeft: "2.5rem", 
          paddingRight: inputValue ? "2.5rem" : "1rem",
          height: "38px" // Match form-select height
        }}
      />
      <span 
        className="position-absolute top-50 translate-middle-y text-muted"
        style={{ left: "0.75rem" }}
      >
        <Search size={16} />
      </span>
      {inputValue && (
        <button
          type="button"
          className="btn-close position-absolute top-50 translate-middle-y"
          style={{ right: "0.75rem" }}
          onClick={handleClear}
        />
      )}
    </div>
  );
};

export default SearchInput;
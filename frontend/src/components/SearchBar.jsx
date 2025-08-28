import React, { useState, useEffect } from 'react';
import './SearchBar.css';

const SearchBar = ({ 
  placeholder = "Search...", 
  onSearch, 
  searchFields = [], 
  data = [], 
  searchBy = 'name',
  className = '',
  showFilters = false,
  filterOptions = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() || filterValue) {
        setIsSearching(true);
        performSearch();
      } else {
        onSearch(data); // Return all data when search is empty
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterValue]);

  const performSearch = () => {
    let filteredData = [...data];

    // Apply text search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => {
        // Search in specified fields
        if (searchFields.length > 0) {
          return searchFields.some(field => {
            const value = getNestedValue(item, field);
            return value && value.toString().toLowerCase().includes(searchLower);
          });
        }
        
        // Default search behavior
        if (typeof searchBy === 'string') {
          const value = getNestedValue(item, searchBy);
          return value && value.toString().toLowerCase().includes(searchLower);
        }
        
        return false;
      });
    }

    // Apply filter
    if (filterValue && filterOptions.length > 0) {
      const selectedFilter = filterOptions.find(option => option.value === filterValue);
      if (selectedFilter && selectedFilter.filterFn) {
        filteredData = selectedFilter.filterFn(filteredData);
      }
    }

    setIsSearching(false);
    onSearch(filteredData);
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilterValue('');
    onSearch(data);
  };

  return (
    <div className={`search-container ${className}`}>
      <div className="search-input-group">
        <div className="search-icon">🔍</div>
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button onClick={clearSearch} className="clear-search-btn">
            ✕
          </button>
        )}
        {isSearching && <div className="search-spinner">⏳</div>}
      </div>
      
      {showFilters && filterOptions.length > 0 && (
        <div className="filter-group">
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="filter-select"
          >
            <option value="">All</option>
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {searchTerm && (
        <div className="search-info">
          <small>Searching in: {searchFields.join(', ') || searchBy}</small>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

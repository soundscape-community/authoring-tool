// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';

import API from '../../api/API';

/**
 * Typeahead user picker.  Searches users by username as the user types (with
 * debounce) and shows a dropdown of matching results.
 *
 * Props:
 *  - value       {Object|null}  Selected user object ({id, username}) or null
 *  - onChange    {Function}      Called with user object on selection, or null on clear
 *  - placeholder {string}        Input placeholder text
 *  - id          {string}        HTML id for the input
 *  - disabled    {boolean}
 */
export default function UserPicker({ value, onChange, placeholder = 'Search users...', id, disabled }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    API.searchUsers(searchQuery)
      .then((users) => {
        setResults(users || []);
        setOpen(true);
      })
      .catch(() => {
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (event) => {
    const val = event.target.value;
    setQuery(val);

    // If user clears the field while a value was selected, clear the selection
    if (value && val !== value.username) {
      onChange(null);
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => search(val.trim()), 250);
  };

  const handleSelect = (user) => {
    setQuery(user.username);
    setOpen(false);
    setResults([]);
    onChange(user);
  };

  const handleFocus = () => {
    // Re-open results if we have them and no selection
    if (results.length > 0 && !value) {
      setOpen(true);
    }
  };

  // When value is cleared externally, reset the input
  useEffect(() => {
    if (!value) {
      setQuery('');
    }
  }, [value]);

  return (
    <div ref={containerRef} className="position-relative">
      <Form.Control
        id={id}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <ListGroup
          className="position-absolute w-100 shadow-sm"
          style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}
        >
          {results.map((user) => (
            <ListGroup.Item
              key={user.id}
              action
              onClick={() => handleSelect(user)}
              active={value && value.id === user.id}
            >
              {user.username}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      {open && !loading && results.length === 0 && query.length >= 1 && (
        <ListGroup
          className="position-absolute w-100 shadow-sm"
          style={{ zIndex: 1050 }}
        >
          <ListGroup.Item className="text-muted">No users found</ListGroup.Item>
        </ListGroup>
      )}
      {loading && (
        <div className="position-absolute end-0 top-50 translate-middle-y pe-3" style={{ zIndex: 1051 }}>
          <span className="spinner-border spinner-border-sm text-secondary" role="status" />
        </div>
      )}
    </div>
  );
}

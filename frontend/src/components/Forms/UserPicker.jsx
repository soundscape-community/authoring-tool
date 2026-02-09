// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React, { useCallback, useRef, useState } from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';

import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-bootstrap-typeahead/css/Typeahead.bs5.css';

import API from '../../api/API';

/**
 * Accessible user picker backed by react-bootstrap-typeahead's AsyncTypeahead.
 *
 * Provides WAI-ARIA combobox semantics including screen reader announcements,
 * arrow-key navigation, and typeahead hinting out of the box.
 *
 * Props:
 *  - value       {Object|null}  Selected user object ({id, username}) or null
 *  - onChange    {Function}      Called with user object on selection, or null on clear
 *  - placeholder {string}        Input placeholder text
 *  - id          {string}        Required HTML id for a11y (aria-labelledby)
 *  - disabled    {boolean}
 */
export default function UserPicker({ value, onChange, placeholder = 'Search users...', id, disabled }) {
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const typeaheadRef = useRef(null);

  const handleSearch = useCallback((query) => {
    setIsLoading(true);
    API.searchUsers(query)
      .then((users) => {
        setOptions(users || []);
      })
      .catch(() => {
        setOptions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleChange = useCallback(
    (selected) => {
      if (selected.length > 0) {
        onChange(selected[0]);
      } else {
        onChange(null);
      }
    },
    [onChange],
  );

  return (
    <AsyncTypeahead
      ref={typeaheadRef}
      id={id}
      isLoading={isLoading}
      labelKey="username"
      minLength={1}
      onSearch={handleSearch}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      selected={value ? [value] : []}
      disabled={disabled}
      clearButton
      delay={250}
      promptText="Type to search..."
      searchText="Searching..."
      emptyLabel="No users found"
      useCache={false}
    />
  );
}


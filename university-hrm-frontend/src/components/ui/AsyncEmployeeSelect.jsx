import React, { useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import { employeesAPI } from '../../services/api';

// AsyncEmployeeSelect — Fixed for 1M+ rows scalability
// Replaces a plain <select> for employee picking.
// Uses react-select async loading to query only 20 employees at a time
// matching the user's search query, instead of loading the full employee list.

// Debounce helper — wait 300ms after typing before firing the API call
function debouncePromise(fn, ms) {
  let timer;
  return (...args) =>
    new Promise((resolve) => {
      clearTimeout(timer);
      timer = setTimeout(() => resolve(fn(...args)), ms);
    });
}

// react-select custom styles to match existing HRMS design system
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? 'var(--primary)' : 'var(--border-color)',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(30, 23, 96, 0.1)' : 'none',
    borderRadius: '6px',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    background: 'var(--white)',
    color: 'var(--text-dark)',
    minHeight: '38px',
    '&:hover': { borderColor: 'var(--primary)' },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '8px',
    border: '1px solid var(--gray-200)',
    boxShadow: 'var(--shadow)',
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected
      ? 'var(--primary)'
      : state.isFocused
      ? 'var(--gray-100)'
      : 'var(--white)',
    color: state.isSelected ? '#fff' : 'var(--text-dark)',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
  }),
  placeholder: (base) => ({ ...base, color: 'var(--gray-400)', fontSize: 13 }),
  singleValue: (base) => ({ ...base, color: 'var(--text-dark)', fontSize: 13 }),
  loadingMessage: (base) => ({ ...base, fontSize: 13 }),
  noOptionsMessage: (base) => ({ ...base, fontSize: 13 }),
};

// Debounced search function — waits 300ms before calling API
const debouncedLoad = debouncePromise(async (inputValue) => {
  try {
    const { data } = await employeesAPI.search(inputValue || '');
    const items = data?.data?.items || data?.data || data?.items || data || [];
    return items.map((emp) => ({
      value: emp.id,
      label: `${emp.first_name} ${emp.last_name} (${emp.employee_id || emp.email})`,
      employee: emp,
    }));
  } catch {
    return [];
  }
}, 300);

export default function AsyncEmployeeSelect({
  value,         // currently selected employee ID (string/number)
  onChange,      // (empId: string, empObj: object) => void
  placeholder = 'Type to search employees...',
  required = false,
  isDisabled = false,
  label,
  style,
}) {
  const handleChange = useCallback(
    (option) => {
      onChange?.(option?.value ?? '', option?.employee ?? null);
    },
    [onChange]
  );

  return (
    <label style={{ display: 'block', marginBottom: 14, ...style }}>
      {label && (
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-light)',
            marginBottom: 5,
            letterSpacing: '-0.01em',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
        </span>
      )}
      <AsyncSelect
        cacheOptions
        defaultOptions
        loadOptions={debouncedLoad}
        onChange={handleChange}
        value={value ? { value } : null}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable
        styles={selectStyles}
        loadingMessage={() => 'Searching employees…'}
        noOptionsMessage={({ inputValue }) =>
          inputValue ? 'No employees found' : 'Type to search…'
        }
      />
    </label>
  );
}

import React from 'react';
import Select from 'react-select';

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
  groupHeading: (base) => ({
    ...base,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--gray-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '8px 12px',
    borderBottom: '1px solid var(--gray-100)',
    marginBottom: 4,
  }),
};

export default function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  required = false,
  isDisabled = false,
  isClearable = true,
  style,
}) {
  const selectedOption = React.useMemo(() => {
    if (!value) return null;
    // Handle both grouped and flat options
    for (const opt of options) {
      if (opt.options) {
        const found = opt.options.find((o) => o.value === value);
        if (found) return found;
      } else if (opt.value === value) {
        return opt;
      }
    }
    return null;
  }, [options, value]);

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
      <Select
        options={options}
        value={selectedOption}
        onChange={(opt) => onChange(opt ? opt.value : '')}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        styles={selectStyles}
        noOptionsMessage={() => 'No options found'}
      />
    </label>
  );
}

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: IconDefinition;
  helperText?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon, helperText, className = '', ...props }, ref) => {
    return (
      <div className={`form-group ${error ? 'has-error' : ''}`}>
        {label && <label className="form-label">{label}</label>}
        
        <div className="input-wrapper">
          {icon && (
            <span className="input-icon">
              <FontAwesomeIcon icon={icon} />
            </span>
          )}
          <input
            ref={ref}
            className={`form-input ${icon ? 'has-icon' : ''} ${className}`}
            {...props}
          />
        </div>
        
        {error && <span className="error-message">{error}</span>}
        {helperText && !error && <span className="helper-text">{helperText}</span>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
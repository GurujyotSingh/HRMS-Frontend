export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,10}$/;
  return re.test(phone);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePAN = (pan: string): boolean => {
  const re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return re.test(pan);
};

export const validateAadhaar = (aadhaar: string): boolean => {
  const re = /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/;
  return re.test(aadhaar);
};

export const validateDateRange = (
  startDate: string,
  endDate: string
): { isValid: boolean; message?: string } => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, message: 'Invalid date format' };
  }

  if (end < start) {
    return { isValid: false, message: 'End date must be after start date' };
  }

  return { isValid: true };
};

export const validateLeaveDays = (
  days: number,
  maxDays: number
): { isValid: boolean; message?: string } => {
  if (days <= 0) {
    return { isValid: false, message: 'Days must be greater than 0' };
  }
  if (days > maxDays) {
    return { isValid: false, message: `Cannot exceed maximum allowed days (${maxDays})` };
  }
  return { isValid: true };
};

export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateNumber = (
  value: number,
  fieldName: string,
  min?: number,
  max?: number
): string | null => {
  if (isNaN(value)) {
    return `${fieldName} must be a valid number`;
  }
  if (min !== undefined && value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (max !== undefined && value > max) {
    return `${fieldName} must be at most ${max}`;
  }
  return null;
};
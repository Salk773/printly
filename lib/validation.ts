/**
 * Validation utilities for form inputs
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // UAE phone number format: +971XXXXXXXXX or 0XXXXXXXXX or 05XXXXXXXX
  // Also accepts international formats
  const phoneRegex = /^(\+971|0)?[2-9]\d{8}$/;
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  return phoneRegex.test(cleaned) || cleaned.length >= 8;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

export function validateRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

export function validateMinLength(value: string, minLength: number): boolean {
  return value.trim().length >= minLength;
}

export function validateMaxLength(value: string, maxLength: number): boolean {
  return value.trim().length <= maxLength;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateCheckoutForm(data: {
  email?: string;
  name?: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  postalCode?: string;
  isGuest?: boolean;
}): ValidationResult {
  const errors: string[] = [];
  const isGuest = data.isGuest ?? false;

  // For guest checkouts, email and name are required
  if (isGuest) {
    if (!data.email || !data.email.trim()) {
      errors.push("Email is required");
    } else if (!validateEmail(data.email)) {
      errors.push("Please enter a valid email address");
    }

    if (!data.name || !data.name.trim()) {
      errors.push("Name is required");
    } else if (data.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters");
    }
  } else {
    // For logged-in users, validate email/name if provided (optional)
  if (data.email && !validateEmail(data.email)) {
    errors.push("Please enter a valid email address");
  }

  if (data.name && data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
    }
  }

  if (!validatePhone(data.phone)) {
    errors.push("Please enter a valid phone number");
  }

  if (!validateRequired(data.address1)) {
    errors.push("Address line 1 is required");
  }

  if (!validateRequired(data.city)) {
    errors.push("City is required");
  }

  if (!validateRequired(data.state)) {
    errors.push("State/Emirate is required");
  }

  if (data.postalCode && data.postalCode.length > 10) {
    errors.push("Postal code is too long");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateAuthForm(data: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: string[] = [];

  if (!validateEmail(data.email)) {
    errors.push("Please enter a valid email address");
  }

  if (data.password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (data.password.length > 128) {
    errors.push("Password is too long");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

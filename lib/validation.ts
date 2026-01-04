/**
 * Validation utilities for form inputs
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UAE phone number format
 * Supports formats: +971XXXXXXXXX, 971XXXXXXXXX, 0XXXXXXXXX, 05XXXXXXXX
 */
export function isValidUAEPhone(phone: string): boolean {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Check for UAE phone patterns
  const patterns = [
    /^\+971[0-9]{9}$/, // +971XXXXXXXXX
    /^971[0-9]{9}$/, // 971XXXXXXXXX
    /^0[0-9]{9}$/, // 0XXXXXXXXX
    /^05[0-9]{8}$/, // 05XXXXXXXX
  ];

  return patterns.some((pattern) => pattern.test(cleaned));
}

/**
 * Sanitize string input (remove potentially harmful characters)
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove HTML brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Validate required fields
 */
export function validateRequired(value: string | null | undefined, fieldName: string): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Validate address fields
 */
export function validateAddress(address: {
  line1: string;
  city: string;
  state: string;
  postalCode?: string | null;
}): string[] {
  const errors: string[] = [];

  if (!address.line1 || address.line1.trim().length === 0) {
    errors.push("Address line 1 is required");
  }

  if (!address.city || address.city.trim().length === 0) {
    errors.push("City is required");
  }

  if (!address.state || address.state.trim().length === 0) {
    errors.push("State/Emirate is required");
  }

  return errors;
}

/**
 * Validate checkout form data
 */
export interface CheckoutFormData {
  email?: string;
  name?: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode?: string;
}

export function validateCheckoutForm(data: CheckoutFormData, isGuest: boolean): string[] {
  const errors: string[] = [];

  if (isGuest) {
    if (!data.email) {
      errors.push("Email is required");
    } else if (!isValidEmail(data.email)) {
      errors.push("Please enter a valid email address");
    }

    if (!data.name || data.name.trim().length === 0) {
      errors.push("Name is required");
    }
  }

  if (!data.phone) {
    errors.push("Phone number is required");
  } else if (!isValidUAEPhone(data.phone)) {
    errors.push("Please enter a valid UAE phone number");
  }

  if (!data.address1 || data.address1.trim().length === 0) {
    errors.push("Address line 1 is required");
  }

  if (!data.city || data.city.trim().length === 0) {
    errors.push("City is required");
  }

  if (!data.state || data.state.trim().length === 0) {
    errors.push("State/Emirate is required");
  }

  return errors;
}


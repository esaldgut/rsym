/**
 * Authentication validation schemas based on Cognito user pool configuration
 * Required attributes: email, given_name, family_name
 * Password policy: 8+ chars, uppercase, lowercase, numbers (no symbols required)
 */

export interface SignUpFormData {
  email: string;
  given_name: string;
  family_name: string;
  password: string;
  confirm_password: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  email: string;
  confirmation_code: string;
  password: string;
  confirm_password: string;
}

// Validation functions
export const validateEmail = (email: string): string | null => {
  if (!email) return 'El correo electrónico es requerido';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Ingresa un correo electrónico válido';
  }
  
  if (email.length > 2048) {
    return 'El correo electrónico es demasiado largo';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'La contraseña es requerida';
  
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra mayúscula';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra minúscula';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe contener al menos un número';
  }
  
  return null;
};

export const validateGivenName = (name: string): string | null => {
  if (!name) return 'El nombre es requerido';
  
  if (name.trim().length === 0) {
    return 'El nombre no puede estar vacío';
  }
  
  if (name.length > 2048) {
    return 'El nombre es demasiado largo';
  }
  
  return null;
};

export const validateFamilyName = (name: string): string | null => {
  if (!name) return 'El apellido es requerido';
  
  if (name.trim().length === 0) {
    return 'El apellido no puede estar vacío';
  }
  
  if (name.length > 2048) {
    return 'El apellido es demasiado largo';
  }
  
  return null;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Debes confirmar tu contraseña';
  
  if (password !== confirmPassword) {
    return 'Las contraseñas no coinciden';
  }
  
  return null;
};

export const validateConfirmationCode = (code: string): string | null => {
  if (!code) return 'El código de confirmación es requerido';
  
  if (!/^\d{6}$/.test(code)) {
    return 'El código debe ser de 6 dígitos';
  }
  
  return null;
};

// Form validation functions
export const validateSignUpForm = (data: SignUpFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  
  const givenNameError = validateGivenName(data.given_name);
  if (givenNameError) errors.given_name = givenNameError;
  
  const familyNameError = validateFamilyName(data.family_name);
  if (familyNameError) errors.family_name = familyNameError;
  
  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;
  
  const confirmPasswordError = validateConfirmPassword(data.password, data.confirm_password);
  if (confirmPasswordError) errors.confirm_password = confirmPasswordError;
  
  return errors;
};

export const validateSignInForm = (data: SignInFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  
  if (!data.password) {
    errors.password = 'La contraseña es requerida';
  }
  
  return errors;
};

export const validateForgotPasswordForm = (data: ForgotPasswordFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  
  return errors;
};

export const validateResetPasswordForm = (data: ResetPasswordFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  
  const codeError = validateConfirmationCode(data.confirmation_code);
  if (codeError) errors.confirmation_code = codeError;
  
  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;
  
  const confirmPasswordError = validateConfirmPassword(data.password, data.confirm_password);
  if (confirmPasswordError) errors.confirm_password = confirmPasswordError;
  
  return errors;
};

// Utility function to check if form has any errors
export const hasErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};

// Password strength indicator
export const getPasswordStrength = (password: string): { score: number; feedback: string } => {
  let score = 0;
  let feedback = '';
  
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1; // Extra points for symbols
  if (password.length >= 12) score += 1; // Extra points for length
  
  switch (score) {
    case 0:
    case 1:
    case 2:
      feedback = 'Contraseña débil';
      break;
    case 3:
    case 4:
      feedback = 'Contraseña buena';
      break;
    case 5:
    case 6:
      feedback = 'Contraseña fuerte';
      break;
    default:
      feedback = 'Contraseña muy fuerte';
  }
  
  return { score, feedback };
};
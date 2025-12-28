export function validateName(name: string) {
  if (typeof name !== 'string') return 'invalid_type';
  const n = name.trim();
  if (!n) return 'required';
  if (n.length > 200) return 'too_long';
  return null;
}

export function validateCedula(cedula: string) {
  if (typeof cedula !== 'string') return 'invalid_type';
  const c = cedula.trim();
  if (!c) return 'required';
  // Basic numeric check (min 6, max 12 digits) - adjust per country rules
  if (!/^\d{6,12}$/.test(c)) return 'invalid_format';
  return null;
}

export function validateEmail(email?: string) {
  if (!email) return null; // optional
  if (typeof email !== 'string') return 'invalid_type';
  const e = email.trim();
  // simple RFC-lite regex
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(e)) return 'invalid_format';
  return null;
}

export function sanitizeString(s?: any) {
  if (s === undefined || s === null) return '';
  return String(s).trim();
}

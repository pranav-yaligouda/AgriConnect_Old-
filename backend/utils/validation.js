// validation.js
// Centralized validation utilities for AgriConnect backend

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/;

function validateEmail(email) {
  return emailRegex.test(email);
}

function validatePassword(password) {
  return passwordRegex.test(password);
}

function validateAddress(address) {
  if (!address || typeof address !== 'object') return false;
  const { street, district, state, zipcode } = address;
  if (!district || !state) return false;
  // Optionally add more checks for zipcode, etc.
  return true;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateAddress,
  emailRegex,
  passwordRegex,
};

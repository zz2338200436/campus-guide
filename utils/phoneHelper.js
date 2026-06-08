function normalizePhoneNumber(phone) {
  return String(phone || '')
    .trim()
    .replace(/(?!^\+)[^\d]/g, '');
}

function canCallPhone(phone) {
  return normalizePhoneNumber(phone).replace(/^\+/, '').length >= 5;
}

module.exports = {
  normalizePhoneNumber,
  canCallPhone
};

const SLOTS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

const MIN_VALUE = 40;
const MAX_VALUE = 600;
const MAX_PER_DAY = 4;

// Today's date as 'YYYY-MM-DD' in the configured timezone
function todayInTz(tz = process.env.APP_TIMEZONE || 'Asia/Kolkata') {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
}

function isValidDateString(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const fail = (field, message) => ({ ok: false, error: { code: 'VALIDATION_ERROR', field, message } });

// Order of checks: value required -> value range -> date -> slot
function validateReadingInput({ value, date, slot }, today = todayInTz()) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fail('value', 'Please enter a glucose value.');
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < MIN_VALUE || num > MAX_VALUE) {
    return fail('value', 'Value must be between 40 and 600 mg/dl.');
  }
  if (!isValidDateString(date)) {
    return fail('date', 'Please select a valid date.');
  }
  if (date > today) {
    return fail('date', 'Date cannot be in the future.');
  }
  if (!Object.prototype.hasOwnProperty.call(SLOTS, slot)) {
    return fail('slot', 'Please choose a time slot.');
  }
  return { ok: true, data: { value: num, date, slot } };
}

const maxPerDayError = () => ({
  code: 'MAX_READINGS_REACHED',
  field: 'date',
  message: 'You can add only 4 readings per day.',
});

const duplicateSlotError = (slot) => ({
  code: 'DUPLICATE_SLOT',
  field: 'slot',
  message: `You already have an ${SLOTS[slot]} reading for this date.`.replace('an Morning', 'a Morning'),
});

module.exports = {
  SLOTS,
  MAX_PER_DAY,
  todayInTz,
  isValidDateString,
  validateReadingInput,
  maxPerDayError,
  duplicateSlotError,
};
export const SLOTS = [
  { key: 'morning', label: 'Morning (fasting)' },
  { key: 'after_breakfast', label: 'After breakfast' },
  { key: 'after_lunch', label: 'After lunch' },
  { key: 'after_dinner', label: 'After dinner' },
];

// Today as YYYY-MM-DD in the user's local timezone
export const todayLocal = () => new Date().toLocaleDateString('en-CA');
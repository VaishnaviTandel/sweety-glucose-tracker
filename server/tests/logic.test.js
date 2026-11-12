const test = require('node:test');
const assert = require('node:assert');
const { getReportRanges } = require('../src/services/reportRanges');
const { validateReadingInput } = require('../src/services/readingValidation');

const TODAY = '2026-11-12';

test('report ranges for 15 Oct 2026', () => {
  const r = getReportRanges('2026-10-15');
  assert.deepStrictEqual(r.daily, { from: '2026-10-15', to: '2026-10-15' });
  assert.deepStrictEqual(r.monthToDate, { from: '2026-10-01', to: '2026-10-15' });
  assert.deepStrictEqual(r.previousMonth, { from: '2026-09-01', to: '2026-09-30' });
});

test('previous month rolls back from January to December', () => {
  assert.deepStrictEqual(getReportRanges('2026-01-15').previousMonth, {
    from: '2025-12-01',
    to: '2025-12-31',
  });
});

test('previous month handles February in a leap year', () => {
  assert.strictEqual(getReportRanges('2024-03-10').previousMonth.to, '2024-02-29');
  assert.strictEqual(getReportRanges('2026-03-10').previousMonth.to, '2026-02-28');
});

test('value is required', () => {
  const r = validateReadingInput({ date: '2026-11-01', slot: 'morning' }, TODAY);
  assert.strictEqual(r.error.message, 'Please enter a glucose value.');
});

test('value must be a whole number between 40 and 600', () => {
  for (const value of [39, 601, 110.5, 'abc']) {
    const r = validateReadingInput({ value, date: '2026-11-01', slot: 'morning' }, TODAY);
    assert.strictEqual(r.error.message, 'Value must be between 40 and 600 mg/dl.');
  }
  assert.ok(validateReadingInput({ value: 40, date: '2026-11-01', slot: 'morning' }, TODAY).ok);
  assert.ok(validateReadingInput({ value: 600, date: '2026-11-01', slot: 'morning' }, TODAY).ok);
});

test('date cannot be in the future', () => {
  const r = validateReadingInput({ value: 100, date: '2026-11-13', slot: 'morning' }, TODAY);
  assert.strictEqual(r.error.message, 'Date cannot be in the future.');
});

test('today is allowed and unknown slot is rejected', () => {
  assert.ok(validateReadingInput({ value: 100, date: TODAY, slot: 'morning' }, TODAY).ok);
  assert.strictEqual(
    validateReadingInput({ value: 100, date: TODAY, slot: 'lunch' }, TODAY).ok,
    false
  );
});
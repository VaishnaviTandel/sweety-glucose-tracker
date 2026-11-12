const pool = require('../db/pool');
const { SLOTS, isValidDateString, todayInTz } = require('../services/readingValidation');
const { getReportRanges } = require('../services/reportRanges');

async function summarize(userId, from, to) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count,
            MAX(value) AS highest,
            MIN(value) AS lowest,
            ROUND(AVG(value), 1) AS average
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );
  const r = rows[0];
  return {
    from,
    to,
    count: r.count,
    highest: r.highest,
    lowest: r.lowest,
    // pg returns numeric as a string, so convert it. null stays null when there are no readings.
    average: r.average === null ? null : Number(r.average),
  };
}

exports.getReports = async (req, res) => {
  try {
    const today = todayInTz();
    const date = req.query.date || today;

    if (!isValidDateString(date)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', field: 'date', message: 'Please select a valid date.' },
      });
    }
    if (date > today) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', field: 'date', message: 'Date cannot be in the future.' },
      });
    }

    const userId = req.user.id;
    const ranges = getReportRanges(date);

    const [daily, monthToDate, previousMonth, readings] = await Promise.all([
      summarize(userId, ranges.daily.from, ranges.daily.to),
      summarize(userId, ranges.monthToDate.from, ranges.monthToDate.to),
      summarize(userId, ranges.previousMonth.from, ranges.previousMonth.to),
      pool.query(
        `SELECT id, slot, value FROM readings
         WHERE user_id = $1 AND reading_date = $2
         ORDER BY CASE slot
           WHEN 'morning' THEN 1 WHEN 'after_breakfast' THEN 2
           WHEN 'after_lunch' THEN 3 WHEN 'after_dinner' THEN 4 END`,
        [userId, date]
      ),
    ]);

    daily.readings = readings.rows.map((r) => ({
      id: r.id,
      slot: r.slot,
      slotLabel: SLOTS[r.slot],
      value: r.value,
    }));

    return res.json({ date, daily, monthToDate, previousMonth });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong.' } });
  }
};
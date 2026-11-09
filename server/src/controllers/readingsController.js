const pool = require('../db/pool');
const {
  SLOTS,
  MAX_PER_DAY,
  isValidDateString,
  validateReadingInput,
  maxPerDayError,
  duplicateSlotError,
} = require('../services/readingValidation');

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong.' } });
};

const serialize = (row) => ({
  id: row.id,
  date: row.reading_date,
  slot: row.slot,
  slotLabel: SLOTS[row.slot],
  value: row.value,
});

const SLOT_ORDER = `CASE slot
  WHEN 'morning' THEN 1 WHEN 'after_breakfast' THEN 2
  WHEN 'after_lunch' THEN 3 WHEN 'after_dinner' THEN 4 END`;

// Checks the "max 4 per day" and "one per slot" rules. excludeId is used when editing.
async function checkDayRules(userId, date, slot, excludeId = null) {
  const { rows } = await pool.query(
    `SELECT id, slot FROM readings
     WHERE user_id = $1 AND reading_date = $2 AND ($3::int IS NULL OR id <> $3)`,
    [userId, date, excludeId]
  );
  if (rows.length >= MAX_PER_DAY) return maxPerDayError();
  if (rows.some((r) => r.slot === slot)) return duplicateSlotError(slot);
  return null;
}

exports.list = async (req, res) => {
  try {
    const { date } = req.query;
    if (date !== undefined && !isValidDateString(date)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', field: 'date', message: 'Please select a valid date.' },
      });
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const params = [req.user.id];
    let where = 'user_id = $1';
    if (date) {
      params.push(date);
      where += ` AND reading_date = $${params.length}`;
    }

    const total = await pool.query(`SELECT COUNT(*)::int AS n FROM readings WHERE ${where}`, params);
    const rows = await pool.query(
      `SELECT id, reading_date, slot, value FROM readings
       WHERE ${where}
       ORDER BY reading_date DESC, ${SLOT_ORDER}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return res.json({
      readings: rows.rows.map(serialize),
      page,
      limit,
      total: total.rows[0].n,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.create = async (req, res) => {
  try {
    const v = validateReadingInput(req.body || {});
    if (!v.ok) return res.status(400).json({ error: v.error });
    const { value, date, slot } = v.data;

    const conflict = await checkDayRules(req.user.id, date, slot);
    if (conflict) return res.status(409).json({ error: conflict });

    const result = await pool.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, reading_date, slot, value`,
      [req.user.id, date, slot, value]
    );
    return res.status(201).json({ reading: serialize(result.rows[0]) });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: duplicateSlotError(req.body.slot) });
    }
    return serverError(res, err);
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return notFound(res);

    const existing = await pool.query('SELECT id FROM readings WHERE id = $1 AND user_id = $2', [
      id,
      req.user.id,
    ]);
    if (!existing.rows[0]) return notFound(res);

    const v = validateReadingInput(req.body || {});
    if (!v.ok) return res.status(400).json({ error: v.error });
    const { value, date, slot } = v.data;

    const conflict = await checkDayRules(req.user.id, date, slot, id);
    if (conflict) return res.status(409).json({ error: conflict });

    const result = await pool.query(
      `UPDATE readings
       SET reading_date = $1, slot = $2, value = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, reading_date, slot, value`,
      [date, slot, value, id, req.user.id]
    );
    return res.json({ reading: serialize(result.rows[0]) });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: duplicateSlotError(req.body.slot) });
    }
    return serverError(res, err);
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return notFound(res);

    const result = await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.user.id,
    ]);
    if (!result.rows[0]) return notFound(res);
    return res.status(204).send();
  } catch (err) {
    return serverError(res, err);
  }
};

function notFound(res) {
  return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reading not found.' } });
}
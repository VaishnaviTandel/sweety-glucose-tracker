// All math is done in UTC on plain 'YYYY-MM-DD' strings, so server timezone never matters.
const fmt = (ms) => new Date(ms).toISOString().slice(0, 10);

function getReportRanges(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const mm = String(m).padStart(2, '0');

  return {
    daily: { from: dateStr, to: dateStr },
    monthToDate: { from: `${y}-${mm}-01`, to: dateStr },
    previousMonth: {
      from: fmt(Date.UTC(y, m - 2, 1)), // 1st of previous month (JS rolls January back to December)
      to: fmt(Date.UTC(y, m - 1, 0)),   // day 0 of this month = last day of previous month
    },
  };
}

module.exports = { getReportRanges };
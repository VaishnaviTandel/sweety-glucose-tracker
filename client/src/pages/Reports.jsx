
import { useEffect, useState } from 'react';
import { api } from '../api';
import { todayLocal } from '../utils';

function ReportCard({ title, report, children }) {
  const range = report.from === report.to ? report.from : `${report.from} to ${report.to}`;
  return (
    <div className="card report">
      <h3>{title}</h3>
      <div className="muted">{range}</div>
      {report.count === 0 ? (
        <p className="empty">No readings for this period yet. 🩸</p>
      ) : (
        <>
          <div className="stats">
            <div><span>Highest</span><strong>{report.highest}</strong></div>
            <div><span>Lowest</span><strong>{report.lowest}</strong></div>
            <div><span>Average</span><strong>{report.average}</strong></div>
            <div><span>Readings</span><strong>{report.count}</strong></div>
          </div>
          {children}
        </>
      )}
    </div>
  );
}

export default function Reports() {
  const [date, setDate] = useState(todayLocal());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!date) return;
    setError('');
    api(`/reports?date=${date}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [date]);

  return (
    <div className="container">
      <div className="row between">
        <h2>Reports</h2>
        <input
          type="date"
          value={date}
          max={todayLocal()}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: 'auto' }}
        />
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {data && (
        <div className="grid3">
          <ReportCard title="Daily" report={data.daily}>
            <table>
              <tbody>
                {data.daily.readings.map((r) => (
                  <tr key={r.id}>
                    <td>{r.slotLabel}</td>
                    <td><strong>{r.value}</strong> mg/dl</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportCard>
          <ReportCard title="Month-to-date" report={data.monthToDate} />
          <ReportCard title="Previous month" report={data.previousMonth} />
        </div>
      )}
    </div>
  );
}
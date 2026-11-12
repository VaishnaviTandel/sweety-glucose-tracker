import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { SLOTS, todayLocal } from '../utils';
import ReadingForm from '../components/ReadingForm';

export default function Dashboard() {
  const [date, setDate] = useState(todayLocal());
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // { id?, date, slot, value? }

  const load = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError('');
    try {
      const data = await api(`/readings?date=${date}`);
      setReadings(data.readings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (r) => {
    if (!window.confirm('Delete this reading?')) return;
    try {
      await api(`/readings/${r.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const onSaved = (reading) => {
    setEditing(null);
    if (reading.date !== date) setDate(reading.date);
    else load();
  };

  return (
    <div className="container">
      <div className="row between">
        <h2>My readings</h2>
        <input
          type="date"
          value={date}
          max={todayLocal()}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: 'auto' }}
        />
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      <div className="grid">
        {SLOTS.map((s) => {
          const r = readings.find((x) => x.slot === s.key);
          return (
            <div className="card slot" key={s.key}>
              <div className="muted">{s.label}</div>
              {r ? (
                <>
                  <div className="big">{r.value} <small>mg/dl</small></div>
                  <div className="row">
                    <button className="secondary" onClick={() => setEditing(r)}>Edit</button>
                    <button className="danger" onClick={() => remove(r)}>Delete</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="big muted">—</div>
                  <button onClick={() => setEditing({ date, slot: s.key })}>Add reading</button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <ReadingForm
          initial={{ date, ...editing }}
          onSaved={onSaved}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

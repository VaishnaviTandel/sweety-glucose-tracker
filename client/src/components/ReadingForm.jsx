import { useState } from 'react';
import { api } from '../api';
import { SLOTS, todayLocal } from '../utils';

export default function ReadingForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({
    date: initial.date,
    slot: initial.slot,
    value: initial.value ?? '',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(initial.id);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body = {
        date: form.date,
        slot: form.slot,
        value: String(form.value).trim() === '' ? undefined : form.value,
      };
      const data = await api(isEdit ? `/readings/${initial.id}` : '/readings', {
        method: isEdit ? 'PUT' : 'POST',
        body,
      });
      onSaved(data.reading);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const fieldError = (f) =>
    error && error.field === f ? <div className="error" role="alert">{error.message}</div> : null;
  const generalError =
    error && !['date', 'slot', 'value'].includes(error.field) ? (
      <div className="error" role="alert">{error.message}</div>
    ) : null;

  return (
    <div className="modal-bg">
      <form className="card modal" onSubmit={submit} noValidate>
        <h2>{isEdit ? 'Edit reading' : 'Add reading'}</h2>

        <label>
          Date
          <input type="date" name="date" value={form.date} max={todayLocal()} onChange={onChange} />
        </label>
        {fieldError('date')}

        <label>
          Time slot
          <select name="slot" value={form.slot} onChange={onChange}>
            {SLOTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
        {fieldError('slot')}

        <label>
          Glucose value (mg/dl)
          <input name="value" type="text" inputMode="numeric" value={form.value} onChange={onChange} />
        </label>
        {fieldError('value')}

        {generalError}

        <div className="row">
          <button disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
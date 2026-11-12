# Sweety – Blood Glucose Tracker

A diabetes patient records up to 4 blood glucose readings a day and views daily,
month-to-date and previous-month reports.

**Stack:** React (Vite) · Node.js + Express · PostgreSQL · JWT + bcrypt

## Features
- Sign up / log in (bcrypt-hashed passwords, JWT). Users only see their own readings.
- Add, view, edit, delete readings (4 slots: Morning (fasting), After breakfast, After lunch, After dinner).
- Validation with clear messages: required value, 40–600 whole number, one per slot per day, max 4 per day, no future dates.
- Reports: highest, lowest, average (1 decimal), count. Daily (with each reading), month-to-date, previous month. Friendly empty state.
- Bonus: pagination on `GET /readings` (`?page=1&limit=20`).

## Prerequisites
Node.js 18+, PostgreSQL 14+.

## Setup

### 1. Database
```sql
CREATE USER sweety_user WITH PASSWORD 'sweety_pass';
CREATE DATABASE sweety OWNER sweety_user;
CREATE DATABASE sweety_test OWNER sweety_user;
```

### 2. Server
```bash
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env  (then edit values)
npm run db:init             # creates tables
npm run seed                # demo user + sample readings
npm run dev                 # http://localhost:5000
```
Demo login: `demo@sweety.com` / `Demo@1234`

### 3. Client
```bash
cd client
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

### 4. Tests
```bash
cd server
npm test
```

## Environment variables
See `server/.env.example` and `client/.env.example`.

## API
| Method | Path | Description |
|---|---|---|
| POST | /auth/register, /auth/login | Returns `{ token, user }` |
| GET | /auth/me | Current user |
| GET | /readings?date=YYYY-MM-DD&page=&limit= | List own readings |
| POST | /readings | Create `{ date, slot, value }` |
| PUT | /readings/:id | Edit |
| DELETE | /readings/:id | Delete |
| GET | /reports?date=YYYY-MM-DD | Daily, month-to-date, previous month |

Errors use one shape: `{ "error": { "code", "field", "message" } }`.

## Notes

### Assumptions
- "Today" is calculated in the timezone set by `APP_TIMEZONE` (default `Asia/Kolkata`), so a valid date is not rejected near midnight.
- Validation order: value required, value range, date valid and not in the future, slot valid, then day rules.
- If a day already has 4 readings, adding another returns "You can add only 4 readings per day." Otherwise a taken slot returns the duplicate-slot message. A 5th reading is always a duplicate slot, so the more specific rule is shown first.
- Editing excludes the reading's own row from the duplicate and max-4 checks.
- Reports reject future dates. With no date given, they use today.
- The previous-month report covers the whole calendar month before the selected date's month.
- Average is rounded to 1 decimal in SQL. With no readings, values are null and the UI shows an empty state.
- DATE columns are returned as plain `YYYY-MM-DD` strings to avoid timezone shifts.
- Another user's reading returns 404 (not 403) so its existence isn't leaked.
- Database constraints (CHECK, UNIQUE) back up the app validation.
- The JWT is kept in `localStorage` for simplicity. This is exposed to XSS.

### What I'd improve with more time
- Integration tests (Supertest) for the API and a React Testing Library test for the reading form.
- httpOnly cookie auth with refresh tokens, and rate limiting on login.
- Charts (Recharts) for readings over the month.
- Docker Compose for Postgres and the app, and a deployed demo.
- A proper migration tool instead of a single `schema.sql`.

## Screenshots / demo
See the `docs/` folder and the recording linked in the submission email.
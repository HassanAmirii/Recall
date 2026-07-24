# Lecture Notetaker

A full-stack study tool that turns lecture audio into shared, organized notes with private per-student AI chat threads.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Audio chunking: ffmpeg via `fluent-ffmpeg`

## Quick start

```bash
cp .env.example backend/.env
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:5000` by default.

## Gemma parser integration

The backend uses real Gemma models through Groq Cloud for transcript cleanup, note structuring, and lecture chat. Configure these environment variables in `backend/.env`:

- `GROQ_API_KEY`: required Groq API key from the Groq console. If Groq returns `401 invalid_api_key`, create a fresh key, replace this value, and restart the backend.
- `GEMMA_MODEL`: optional model override; defaults to `gemma2-9b-it`. Supported values are `gemma2-9b-it` and `gemma2-27b-it`.
- `TOGETHER_FALLBACK_ENABLED`: set to `true` only when you also provide a valid `TOGETHER_API_KEY`; otherwise the fallback stays disabled to avoid repeated missing-key errors.
- `TOGETHER_API_KEY`: optional Together AI fallback key.

`backend/.env` is loaded automatically whether you start the backend from the repo root or from the `backend` directory.

Uploads now include an optional parser context field. Add course/topic details, local terminology, lecturer accent notes, SDG framing, or extraction goals so Gemma can resolve ambiguous audio and produce more useful structured notes.

## Core flows

1. Register or log in.
2. Create a group; the creator is automatically an admin.
3. Admins can upload lectures directly to a group. Those lectures are approved immediately.
4. Members can upload personal lectures, then submit them to a group for admin approval.
5. Admins approve pending submissions in the group page queue.
6. Approved group lectures appear in the group lecture list.
7. Each user gets a private chat thread per lecture.

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/groups`
- `POST /api/groups`
- `GET /api/groups/:groupId`
- `POST /api/groups/:groupId/users`
- `DELETE /api/groups/:groupId/users/:userId`
- `GET /api/groups/:groupId/pending`
- `GET /api/lectures/personal`
- `POST /api/lectures`
- `GET /api/lectures/:lectureId`
- `POST /api/lectures/:lectureId/submit`
- `POST /api/lectures/:lectureId/approve`
- `POST /api/lectures/:lectureId/chat`

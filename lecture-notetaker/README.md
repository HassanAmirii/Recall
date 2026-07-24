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

The backend uses the Google Generative Language API as the Gemma parser for transcription, note structuring, and lecture chat. Configure these environment variables in `backend/.env`:

- `GEMMA_API_KEY` or `GOOGLE_API_KEY`: API key for the model endpoint.
- `GEMMA_MODEL`: optional model override; defaults to `gemma-3-27b-it`.

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

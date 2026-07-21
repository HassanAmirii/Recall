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

## Current placeholder AI behavior

The backend has placeholder implementations for:

- `transcribeChunk(chunkPath)`
- `cleanAndStructureNotes(fullTranscript)`
- `answerQuestion(structuredNotes, question, chatHistory)`

Each placeholder has a `// TODO: replace with real Gemma 4 API call` comment and returns dummy data so the upload, chunking, notes, submission, approval, and chat flows can be tested end-to-end.

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

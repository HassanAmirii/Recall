# Progress - Lecture Notetaker

## Current status
- Full project scaffold is implemented under `lecture-notetaker/`.

## Completed
- Root progress tracker created for future AI handoff.
- Backend Express app scaffolded with auth, group, lecture, and chat routes.
- MongoDB/Mongoose models added for User, Group, GroupMembership, Lecture, and ChatThread.
- Audio service splits uploads into 30-second ffmpeg chunks, with fallback to one chunk if ffmpeg is unavailable.
- Gemma 4 placeholder service functions added with TODO comments.
- Frontend React/Vite app scaffolded with auth, home, group, lecture detail, upload, approval, and personal chat UI.
- README, .env.example, package manifests, and .gitignore added.

## Next steps
- Run `npm install` from `lecture-notetaker/`.
- Start MongoDB and ffmpeg locally.
- Run `npm run dev` and test the end-to-end flow.
- Replace placeholder Gemma 4 functions in `backend/src/services/gemmaService.js`.

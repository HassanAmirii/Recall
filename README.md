# Recall

Turn lecture audio into structured study notes you can actually use. Record or upload your class lectures, get clean summaries with key points and definitions organized automatically, ask the AI anything you missed, and share materials with your study group so everyone's on the same page.

## Installation

You'll need Node.js and a running MongoDB instance on your machine, plus ffmpeg for audio processing.

1. **Clone the repository**

   ```bash
   git clone https://github.com/HassanAmirii/Recall.git
   cd Recall/lecture-notetaker
   ```

2. **Install dependencies**

   The project uses npm workspaces, so one command installs both the backend and frontend.

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file and fill in your own keys.

   ```bash
   cp .env.example .env
   ```

   The required variables:

   - `MONGODB_URI` - connection string for MongoDB (defaults to `mongodb://127.0.0.1:27017/lecture-notetaker`)
   - `JWT_SECRET` - any random string for signing auth tokens
   - `GOOGLE_API_KEY` - your Google AI Studio key for the Gemma model (free tier works)
   - `GROQ_API_KEY` - for cloud transcription (Groq offers free credits)
   - Optionally, `TOGETHER_API_KEY` for a backup model provider

4. **Start the application**

   From the `lecture-notetaker` folder, run:

   ```bash
   npm run dev
   ```

   This boots the Express API on port 5000 and the Vite frontend on port 5173 by default.

## Usage

Once everything is running, open `http://localhost:5173` in your browser. You'll land on the public landing page. Create an account or log in.

After login, the home screen shows your study groups and personal lecture drafts.

### Recording or uploading a lecture

Click the **New Recording** button in the top bar. Give your lecture a title, an optional course tag, and some context to help the AI understand the topic better, then upload an audio file. If you are an admin of a group, you can upload directly into that group and the lecture will be immediately approved.

The backend will split the audio into 30-second chunks, send each to Groq for transcription, then pass the full text through Gemma (via Google AI Studio) to generate structured notes with:

- A summary
- Learning objectives
- Section-by-section breakdowns with key points, examples, and definitions
- Action items for further study

A progress indicator will show the chunked processing, and once it completes, the lecture appears in your personal list or the group library.

### Viewing notes and chatting with the AI

Click any lecture to see the full structured notes page. You can download the notes as a PDF with one click. On the right, a chat panel lets you ask follow-up questions about the material - the AI answers using the lecture's notes as context, never inventing random facts.

### Study groups

Create a new group from the home page. Inside a group you can:

- Invite other users by username (as members or admins)
- See all approved lectures
- Admins can upload directly, view a pending submission queue, and approve lectures submitted by members

Members can upload personal drafts and then submit them to a group for admin approval.

## Features

- **Transcription and note generation**  
  Upload any audio file (MP3, WAV, M4A) and get a cleaned transcript plus structured study notes automatically.

- **AI chat with your lectures**  
  Ask anything about the lecture content and get contextual answers backed by the notes.

- **Group workspaces**  
  Share approved lectures with a study group, with role-based access control.

- **Admin approval flow**  
  Members submit drafts, admins review and approve them before they become visible to the group.

- **PDF export**  
  Download a clean A4 PDF of any lecture's structured notes for offline study.

- **Processing visibility**  
  Real-time progress indicators show audio chunking and transcription status.

- **Resilient design**  
  If ffmpeg isn't available, the system falls back to processing the whole file as one chunk. Multiple cloud AI backends provide redundancy.

## Technologies Used

| Technology | Purpose |
|------------|---------|
| [Node.js](https://nodejs.org/) | Backend runtime |
| [Express](https://expressjs.com/) | API server |
| [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/) | Database and ODM |
| [React](https://react.dev/) + [Vite](https://vitejs.dev/) | Frontend SPA |
| [React Router](https://reactrouter.com/) | Client-side routing |
| [Google Gemini / Gemma](https://ai.google.dev/) | Note structuring and chat (free tier) |
| [Groq](https://groq.com/) | Cloud transcription (Whisper) |
| [Together AI](https://www.together.ai/) | Fallback model provider |
| [Fluent ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) | Audio chunk splitting |
| [Multer](https://github.com/expressjs/multer) | File upload handling |
| [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) | Client-side PDF generation |
| [React Markdown](https://github.com/remarkjs/react-markdown) | Rendering AI responses |

## Badges

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://dokugen.samueltuoyo.com)
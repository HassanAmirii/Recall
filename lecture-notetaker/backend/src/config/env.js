import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(__filename), "../..");

// Load environment variables from the directory where the command is run first,
// then from backend/.env. This keeps deployed environment variables intact while
// making local development work whether npm is started from the repo root or the
// backend folder.
dotenv.config();
dotenv.config({ path: path.join(backendRoot, ".env") });

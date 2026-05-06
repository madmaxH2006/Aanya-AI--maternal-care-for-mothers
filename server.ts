import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// --- In-Memory Database (Demo Mode) ---
const USER_ID = "demo-user";
const db = {
  profiles: [] as any[],
  logs: [] as any[],
  messages: [] as any[]
};

// --- API Routes ---
app.get('/api', (req, res) => {
  res.json({ status: 'ok', name: 'Aanya API (Storage Layer)' });
});

app.get('/api/profile', async (req, res) => {
  let profile = db.profiles.find(p => p.user_id === USER_ID);
  if (!profile) {
    profile = {
      user_id: USER_ID,
      name: 'Future Mom',
      age: '',
      due_date: '',
      last_period_date: '',
      notes: '',
      created_at: new Date().toISOString()
    };
    db.profiles.push(profile);
  }
  res.json(profile);
});

app.put('/api/profile', async (req, res) => {
  const index = db.profiles.findIndex(p => p.user_id === USER_ID);
  if (index > -1) {
    db.profiles[index] = { ...db.profiles[index], ...req.body };
  }
  res.json({ success: true });
});

app.get('/api/logs', async (req, res) => {
  const { type } = req.query;
  let result = db.logs.filter(l => l.user_id === USER_ID);
  if (type) {
    result = result.filter(l => l.type === type);
  }
  res.json(result);
});

app.post('/api/logs', async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [req.body];
  const saved = [];
  
  for (const item of items) {
    const { type, data, note } = item;
    const newLog = {
      id: uuidv4(),
      user_id: USER_ID,
      type,
      data: data || {},
      note: note || "Logged",
      timestamp: new Date().toISOString()
    };
    db.logs.push(newLog);
    saved.push(newLog);
  }
  
  res.json(saved.length === 1 ? saved[0] : saved);
});

app.delete('/api/logs/:id', async (req, res) => {
  db.logs = db.logs.filter(l => !(l.id === req.params.id && l.user_id === USER_ID));
  res.json({ success: true });
});

app.get('/api/chat/history', async (req, res) => {
  const history = db.messages.filter(m => m.user_id === USER_ID);
  res.json(history);
});

app.post('/api/chat', async (req, res) => {
  const { message, role, id } = req.body;
  const msg = {
    id: id || uuidv4(),
    user_id: USER_ID,
    role: role || 'user',
    content: message,
    timestamp: new Date().toISOString()
  };
  db.messages.push(msg);
  res.json(msg);
});

app.delete('/api/chat/history', async (req, res) => {
  db.messages = db.messages.filter(m => m.user_id !== USER_ID);
  res.json({ success: true });
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


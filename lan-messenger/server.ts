import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://sushantsahoo378_db_user:Jql51D65VhxrdNAt@lan2.hgq1mur.mongodb.net/?appName=LAN2';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  senderId: String,
  senderName: String,
  senderAvatar: String,
  receiverId: String,
  content: String,
  type: { type: String, default: 'text' },
  timestamp: { type: Date, default: Date.now },
  fileName: String,
  fileSize: Number,
  fileType: String
});

const MessageModel = mongoose.model('Message', messageSchema);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  avatar: { type: String, default: '' },
  role: { type: String, default: 'user' } // 'admin' or 'user'
});

const UserModel = mongoose.model('User', userSchema);

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed
});

const SettingsModel = mongoose.model('Settings', settingsSchema);

// Initial Admin Setup
async function setupAdmin() {
  const adminEmail = 'admin@lan.com';
  const adminPassword = 'Admin@123#';
  const adminUser = await UserModel.findOne({ email: adminEmail });
  
  if (!adminUser) {
    await UserModel.create({
      email: adminEmail,
      password: adminPassword,
      username: 'Administrator',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      role: 'admin'
    });
    console.log('Admin user created');
  } else {
    // Ensure password is correct even if user exists
    adminUser.password = adminPassword;
    await adminUser.save();
    console.log('Admin user updated');
  }
  
  // Initial Logo Setup
  const logoExists = await SettingsModel.findOne({ key: 'logo_url' });
  if (!logoExists) {
    await SettingsModel.create({
      key: 'logo_url',
      value: 'https://cdn-icons-png.flaticon.com/512/5962/5962463.png'
    });
  }
}
setupAdmin();

// Setup file uploads
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Settings Endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await SettingsModel.find();
    const settingsMap = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsMap);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings', details: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    await SettingsModel.findOneAndUpdate({ key }, { value }, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Auth Endpoints
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email, password });
  if (user) {
    res.json({ 
      id: user._id, 
      email: user.email, 
      username: user.username, 
      avatar: user.avatar, 
      role: user.role 
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin User Management
app.get('/api/admin/users', async (req, res) => {
  const users = await UserModel.find({}, '-password');
  res.json(users);
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const newUser = await UserModel.create(req.body);
    res.json(newUser);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create user' });
  }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    await UserModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete user' });
  }
});
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
  maxHttpBufferSize: 1e8 // 100 MB
});

const PORT = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// File upload endpoint
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ error: 'Upload failed', details: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      url: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });
  });
});

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await MessageModel.find().sort({ timestamp: 1 }).limit(1000);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Socket.IO logic
interface User {
  id: string;
  username: string;
  avatar: string;
  status: 'Available' | 'Busy' | 'Away' | 'Offline';
  note?: string;
}

const users = new Map<string, User>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', async (data: { username: string, avatar: string }) => {
    const user: User = {
      id: socket.id,
      username: data.username,
      avatar: data.avatar,
      status: 'Available',
      note: ''
    };
    users.set(socket.id, user);
    
    // Broadcast updated user list
    io.emit('users', Array.from(users.values()));
    
    // Send message history to the joined user
    try {
      const history = await MessageModel.find().sort({ timestamp: 1 }).limit(1000);
      socket.emit('history', history);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
    
    // Broadcast join message
    socket.broadcast.emit('user_joined', user);
  });

  socket.on('update_profile', (data: { status?: any, note?: string }) => {
    const user = users.get(socket.id);
    if (user) {
      if (data.status) user.status = data.status;
      if (data.note !== undefined) user.note = data.note;
      users.set(socket.id, user);
      io.emit('users', Array.from(users.values()));
    }
  });

  socket.on('send_message', async (data) => {
    const user = users.get(socket.id);
    const messageData = {
      id: data.id,
      senderId: socket.id,
      senderName: user?.username || 'Unknown',
      senderAvatar: user?.avatar || '',
      receiverId: data.receiverId || null, // null for public
      content: data.content,
      type: data.type || 'text',
      timestamp: data.timestamp || new Date().toISOString(),
      fileName: data.fileName || null,
      fileSize: data.fileSize || null,
      fileType: data.fileType || null
    };

    // Save to MongoDB
    try {
      const message = new MessageModel(messageData);
      await message.save();
    } catch (err) {
      console.error('Failed to save message:', err);
    }

    if (messageData.receiverId) {
      // Private message
      io.to(messageData.receiverId).emit('receive_message', messageData);
      // Send back to sender as well
      socket.emit('receive_message', messageData);
    } else {
      // Public message
      io.emit('receive_message', messageData);
    }
  });

  socket.on('typing', (data: { receiverId: string | null, isTyping: boolean }) => {
    const typingData = { senderId: socket.id, receiverId: data.receiverId, isTyping: data.isTyping };
    if (data.receiverId) {
      io.to(data.receiverId).emit('user_typing', typingData);
    } else {
      socket.broadcast.emit('user_typing', typingData);
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      io.emit('users', Array.from(users.values()));
      io.emit('user_left', user);
    }
    console.log('User disconnected:', socket.id);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

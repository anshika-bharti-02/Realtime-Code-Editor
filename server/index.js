const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codeeditor';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.log('⚠️  MongoDB not connected (running without DB):', err.message));

// Room Schema
const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  code: { type: String, default: '// Start coding here...\n' },
  language: { type: String, default: 'javascript' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Room = mongoose.model('Room', roomSchema);

// In-memory store as fallback when MongoDB is not available
const roomStore = {};
const userSocketMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => ({
    socketId,
    username: userSocketMap[socketId],
  }));
}

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Real-Time Code Editor API running' });
});

app.get('/api/room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    let room = await Room.findOne({ roomId });
    if (!room) {
      // Check in-memory store
      if (roomStore[roomId]) {
        return res.json({ roomId, code: roomStore[roomId].code, language: roomStore[roomId].language });
      }
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ roomId: room.roomId, code: room.code, language: room.language });
  } catch (err) {
    // Fallback to in-memory
    if (roomStore[roomId]) {
      return res.json({ roomId, code: roomStore[roomId].code, language: roomStore[roomId].language });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Socket.IO Events
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join Room
  socket.on('JOIN_ROOM', async ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    // Load room code from DB or memory
    let code = '// Start coding here...\nconsole.log("Hello, World!");\n';
    let language = 'javascript';

    try {
      let room = await Room.findOne({ roomId });
      if (room) {
        code = room.code;
        language = room.language;
      } else {
        // Create new room in DB
        room = new Room({ roomId, code, language });
        await room.save();
      }
    } catch (err) {
      // Fallback to in-memory
      if (!roomStore[roomId]) {
        roomStore[roomId] = { code, language };
      } else {
        code = roomStore[roomId].code;
        language = roomStore[roomId].language;
      }
    }

    // Send current code to the newly joined user
    socket.emit('LOAD_CODE', { code, language });

    // Notify all clients in the room
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit('JOINED', {
        clients,
        username,
        socketId: socket.id,
      });
    });

    console.log(`👤 ${username} joined room: ${roomId}`);
  });

  // Code Change
  socket.on('CODE_CHANGE', async ({ roomId, code }) => {
    // Broadcast to all OTHER clients in the room
    socket.to(roomId).emit('CODE_CHANGE', { code });

    // Save to DB or memory (debounced via client)
    try {
      await Room.findOneAndUpdate(
        { roomId },
        { code, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    } catch {
      if (roomStore[roomId]) roomStore[roomId].code = code;
    }
  });

  // Language Change
  socket.on('LANGUAGE_CHANGE', async ({ roomId, language }) => {
    socket.to(roomId).emit('LANGUAGE_CHANGE', { language });
    try {
      await Room.findOneAndUpdate({ roomId }, { language });
    } catch {
      if (roomStore[roomId]) roomStore[roomId].language = language;
    }
  });

  // Sync Request (new user wants full code)
  socket.on('SYNC_CODE', ({ socketId, code }) => {
    io.to(socketId).emit('CODE_CHANGE', { code });
  });

  // Cursor Position
  socket.on('CURSOR_CHANGE', ({ roomId, cursor, username }) => {
    socket.to(roomId).emit('CURSOR_CHANGE', { cursor, username, socketId: socket.id });
  });

  // Disconnect
  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.to(roomId).emit('DISCONNECTED', {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

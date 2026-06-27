# ⌨️ CodeSync — Real-Time Collaborative Code Editor

A full-stack real-time code editor built with the MERN stack and Socket.IO. Multiple users can join a shared room and edit code simultaneously with instant synchronization.

## ✨ Features

- **Real-Time Sync** — Code changes are broadcast to all users in the room instantly via WebSockets
- **Room-Based Collaboration** — Create or join rooms using unique Room IDs
- **Multi-Language Support** — JavaScript, Python, Java, C++, and Rust with full syntax highlighting
- **Persistent Code** — Code is saved to MongoDB per room (falls back to in-memory if no DB)
- **Live User Presence** — See who's in the room with color-coded avatars
- **Language Switching** — Change the language and it syncs to all connected users
- **Copy Utilities** — One-click copy for Room ID and code

## 🛠️ Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Frontend   | React.js, React Router, CodeMirror 6 |
| Backend    | Node.js, Express.js                |
| Database   | MongoDB with Mongoose              |
| Real-Time  | Socket.IO (WebSockets)             |
| Styling    | Custom CSS (Catppuccin Mocha theme)|

## 🚀 Getting Started

### Prerequisites

- Node.js v16+
- MongoDB (optional — app works without it using in-memory storage)
- npm or yarn

### Installation

**1. Clone the repository**
```bash
git clone <your-repo-url>
cd realtime-code-editor
```

**2. Install all dependencies**
```bash
# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

**3. Configure environment variables**

Server (`server/.env`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/codeeditor
CLIENT_URL=http://localhost:3000
```

Client (`client/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

**4. Run the application**

Open two terminals:

```bash
# Terminal 1 — Start the server
cd server
npm run dev        # with nodemon (auto-restart)
# or
npm start          # without nodemon
```

```bash
# Terminal 2 — Start the client
cd client
npm start
```

The app will open at **http://localhost:3000**.

## 📁 Project Structure

```
realtime-code-editor/
├── server/
│   ├── index.js          # Express + Socket.IO server
│   ├── .env.example
│   └── package.json
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Client.js       # User avatar component
│   │   ├── pages/
│   │   │   ├── Home.js         # Landing/join page
│   │   │   └── EditorPage.js   # Main editor
│   │   ├── socket/
│   │   │   └── index.js        # Socket.IO client setup
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── .env.example
│   └── package.json
└── README.md
```

## 🔌 Socket.IO Events

| Event             | Direction       | Description                              |
|-------------------|-----------------|------------------------------------------|
| `JOIN_ROOM`       | Client → Server | Join a room with roomId + username       |
| `JOINED`          | Server → Client | Notify all users someone joined          |
| `LOAD_CODE`       | Server → Client | Send current code to newly joined user   |
| `CODE_CHANGE`     | Bidirectional   | Broadcast code changes in real-time      |
| `SYNC_CODE`       | Client → Server | Sync current code to a specific socket   |
| `LANGUAGE_CHANGE` | Bidirectional   | Broadcast language selection changes     |
| `DISCONNECTED`    | Server → Client | Notify when a user leaves                |

## 🌐 REST API

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| GET    | `/api/health`     | Server health check      |
| GET    | `/api/room/:id`   | Get room's saved code    |

## 📝 Usage

1. Open **http://localhost:3000**
2. Click **Create New Room** to get a unique Room ID, or paste an existing one
3. Enter your display name and click **Join Room**
4. Share the Room ID with collaborators
5. Start coding — changes sync instantly for everyone!

## 🎨 Customization

- **Add languages**: Install the CodeMirror language package and add it to `LANGUAGES` in `EditorPage.js`
- **Theme**: The editor uses `oneDark`. Swap it with any `@codemirror/theme-*` package
- **Port**: Change `PORT` in `server/.env` and `REACT_APP_BACKEND_URL` in `client/.env`

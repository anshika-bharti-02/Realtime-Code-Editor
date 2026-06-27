import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success('New room created! Enter your name and join.');
  };

  const joinRoom = () => {
    if (!roomId.trim()) {
      toast.error('Please enter a Room ID');
      return;
    }
    if (!username.trim()) {
      toast.error('Please enter your name');
      return;
    }
    navigate(`/editor/${roomId}`, {
      state: { username: username.trim() },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') joinRoom();
  };

  return (
    <div className="home-page">
      <div className="home-card">
        <div className="home-logo">
          <div className="home-logo-icon">⌨️</div>
          <h1>CodeSync</h1>
        </div>
        <p className="home-tagline">Real-time collaborative code editor</p>

        <div className="home-form">
          <div className="input-group">
            <label>Room ID</label>
            <input
              type="text"
              placeholder="Enter room ID to join"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="input-group">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="Enter your display name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button className="btn-primary" onClick={joinRoom}>
            Join Room →
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <button className="btn-secondary" onClick={createNewRoom}>
            ✦ Create New Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;

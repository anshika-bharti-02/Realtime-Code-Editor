import React from 'react';

const AVATAR_COLORS = [
  '#89b4fa', '#cba6f7', '#a6e3a1', '#f9e2af',
  '#94e2d5', '#f38ba8', '#fab387', '#74c7ec',
];

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const Client = ({ username, isYou }) => {
  const initials = username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const color = getColor(username);

  return (
    <div className="client-item">
      <div
        className="client-avatar"
        style={{ background: color }}
        title={username}
      >
        {initials}
      </div>
      <div>
        <div className="client-name">{username}</div>
        {isYou && <div className="client-you">(you)</div>}
      </div>
    </div>
  );
};

export default Client;

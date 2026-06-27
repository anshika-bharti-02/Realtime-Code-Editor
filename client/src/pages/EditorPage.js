import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { initSocket } from '../socket';
import Client from '../components/Client';

const LANGUAGES = {
  javascript: { label: 'JavaScript', ext: javascript({ jsx: true }) },
  python: { label: 'Python', ext: python() },
  java: { label: 'Java', ext: java() },
  cpp: { label: 'C++', ext: cpp() },
  rust: { label: 'Rust', ext: rust() },
};

const SOCKET_EVENTS = {
  JOIN_ROOM: 'JOIN_ROOM',
  JOINED: 'JOINED',
  CODE_CHANGE: 'CODE_CHANGE',
  SYNC_CODE: 'SYNC_CODE',
  LOAD_CODE: 'LOAD_CODE',
  DISCONNECTED: 'DISCONNECTED',
  LANGUAGE_CHANGE: 'LANGUAGE_CHANGE',
};

const EditorPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();
  const username = location.state?.username;

  const [clients, setClients] = useState([]);
  const [code, setCode] = useState('// Start coding here...\nconsole.log("Hello, World!");\n');
  const [language, setLanguage] = useState('javascript');
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  const socketRef = useRef(null);
  const codeRef = useRef(code);
  const typingTimerRef = useRef({});

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    const init = async () => {
      socketRef.current = await initSocket();

      socketRef.current.on('connect_error', () => {
        toast.error('Connection failed. Retrying...');
        setConnected(false);
      });

      socketRef.current.on('connect', () => {
        setConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        setConnected(false);
      });

      socketRef.current.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, username });

      // Received room's current code on join
      socketRef.current.on(SOCKET_EVENTS.LOAD_CODE, ({ code: roomCode, language: roomLang }) => {
        setCode(roomCode);
        codeRef.current = roomCode;
        setLanguage(roomLang || 'javascript');
      });

      // Someone joined
      socketRef.current.on(SOCKET_EVENTS.JOINED, ({ clients: roomClients, username: joinedUser, socketId }) => {
        if (joinedUser !== username) {
          toast(`${joinedUser} joined the room`, {
            icon: '👋',
          });
          // Sync our code to the new user
          socketRef.current.emit(SOCKET_EVENTS.SYNC_CODE, {
            socketId,
            code: codeRef.current,
          });
        }
        setClients(roomClients);
      });

      // Incoming code change from others
      socketRef.current.on(SOCKET_EVENTS.CODE_CHANGE, ({ code: newCode }) => {
        if (newCode !== null) {
          setCode(newCode);
          codeRef.current = newCode;
        }
      });

      // Language change from others
      socketRef.current.on(SOCKET_EVENTS.LANGUAGE_CHANGE, ({ language: newLang }) => {
        setLanguage(newLang);
        toast(`Language changed to ${LANGUAGES[newLang]?.label || newLang}`, { icon: '🔧' });
      });

      // Someone disconnected
      socketRef.current.on(SOCKET_EVENTS.DISCONNECTED, ({ socketId, username: leftUser }) => {
        toast(`${leftUser} left the room`, { icon: '👋' });
        setClients((prev) => prev.filter((c) => c.socketId !== socketId));
        setTypingUsers((prev) => prev.filter((u) => u !== leftUser));
      });
    };

    init();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current?.off(SOCKET_EVENTS.JOINED);
      socketRef.current?.off(SOCKET_EVENTS.DISCONNECTED);
      socketRef.current?.off(SOCKET_EVENTS.CODE_CHANGE);
      socketRef.current?.off(SOCKET_EVENTS.LOAD_CODE);
      socketRef.current?.off(SOCKET_EVENTS.LANGUAGE_CHANGE);
    };
  }, [roomId, username, navigate]);

  const handleCodeChange = useCallback(
    (value) => {
      setCode(value);
      codeRef.current = value;
      socketRef.current?.emit(SOCKET_EVENTS.CODE_CHANGE, { roomId, code: value });
    },
    [roomId]
  );

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socketRef.current?.emit(SOCKET_EVENTS.LANGUAGE_CHANGE, { roomId, language: newLang });
    toast.success(`Switched to ${LANGUAGES[newLang]?.label}`);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied!');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeRef.current);
    toast.success('Code copied to clipboard!');
  };

  const leaveRoom = () => {
    navigate('/');
  };

  const lineCount = code.split('\n').length;
  const charCount = code.length;

  return (
    <div className="editor-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">⌨️</div>
            <span>CodeSync</span>
          </div>
          <div className="room-id-badge">
            <span className="label">Room</span>
            <span className="value" title={roomId}>{roomId}</span>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Connected ({clients.length})</div>
          <div className="clients-list">
            {clients.map((client) => (
              <Client
                key={client.socketId}
                username={client.username}
                isYou={client.username === username}
              />
            ))}
          </div>
        </div>

        <div className="sidebar-actions">
          <button className="sidebar-btn copy" onClick={copyRoomId}>
            🔗 Copy Room ID
          </button>
          <button className="sidebar-btn leave" onClick={leaveRoom}>
            ← Leave Room
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="editor-area">
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <div className="connection-status">
              <span className={`status-dot ${connected ? '' : 'disconnected'}`} />
              {connected ? 'Live' : 'Reconnecting...'}
            </div>
            <span className="user-count-badge">
              {clients.length} {clients.length === 1 ? 'user' : 'users'}
            </span>
          </div>

          <select
            className="language-select"
            value={language}
            onChange={handleLanguageChange}
          >
            {Object.entries(LANGUAGES).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <div className="toolbar-right">
            <button className="toolbar-btn" onClick={copyCode}>
              📋 Copy Code
            </button>
          </div>
        </div>

        <div className="editor-wrapper">
          <CodeMirror
            value={code}
            height="100%"
            theme={oneDark}
            extensions={[LANGUAGES[language]?.ext || javascript()]}
            onChange={handleCodeChange}
            style={{ height: '100%' }}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: false,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              defaultKeymap: true,
              searchKeymap: true,
              historyKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
          />
        </div>

        <div className="editor-footer">
          <span className="footer-info">📄 {lineCount} lines</span>
          <span className="footer-info">· {charCount} chars</span>
          <span className="footer-info">· {LANGUAGES[language]?.label}</span>
          {typingUsers.length > 0 && (
            <span className="typing-indicator">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorPage;

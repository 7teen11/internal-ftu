import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// Web Audio API subtle chime sound synthesizer (zero external mp3 needed)
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2); // D6

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn('Audio chime playback error:', e);
  }
}

export function SocketProvider({ children }) {
  const { user, token, handleForcedLogout, refreshRoster } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeChatContext, setActiveChatContext] = useState(null); // { type: 'direct'|'group', id: number }
  const activeChatRef = useRef(activeChatContext);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    activeChatRef.current = activeChatContext;
  }, [activeChatContext]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io({
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected as', user.name);
    });

    newSocket.on('online_users', (ids) => {
      setOnlineUsers(ids);
    });

    // Single active session revocation listener
    newSocket.on('session_terminated', (data) => {
      console.warn('[Socket] Session terminated:', data.reason);
      handleForcedLogout(data.reason);
    });

    // Real-time top notification bell alert listener
    newSocket.on('notification_bell_alert', (alert) => {
      // Check if user is currently looking at this conversation:
      const current = activeChatRef.current;
      const isViewingActive =
        current &&
        ((alert.type === 'DirectMessage' && current.type === 'direct' && current.id === alert.reference_id) ||
         (alert.type === 'GroupMessage' && current.type === 'group' && current.id === alert.reference_id));

      if (isViewingActive) {
        // In active chat: silent, don't trigger chime or increment bell
        return;
      }

      // Add to notifications
      const newNotif = {
        id: Date.now() + Math.random(),
        type: alert.type,
        title: alert.title,
        body: alert.body,
        reference_id: alert.reference_id,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_read: false
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);

      if (alert.play_sound && soundEnabledRef.current) {
        playNotificationChime();
      }
    });

    newSocket.on('user_roster_updated', () => {
      refreshRoster();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        notifications,
        unreadCount,
        markAllNotificationsRead,
        clearNotification,
        soundEnabled,
        setSoundEnabled,
        activeChatContext,
        setActiveChatContext
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}


import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Directory from './components/Directory';
import MustRead from './components/MustRead';
import DirectChat from './components/DirectChat';
import GroupChat from './components/GroupChat';
import Relax from './components/Relax';
import AdminPanel from './components/AdminPanel';
import LoginModal from './components/LoginModal';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('directory');
  const [targetUserId, setTargetUserId] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState(null);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-400">Loading FTU Chat Workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  const handleStartDirectChat = (userId) => {
    setTargetUserId(userId);
    setActiveTab('messages');
  };

  const handleStartGroupChat = (groupId) => {
    setTargetGroupId(groupId);
    setActiveTab('groups');
  };

  const handleHeaderNavigate = (tab, referenceId) => {
    setActiveTab(tab);
    if (tab === 'messages' && referenceId) {
      setTargetUserId(referenceId);
    } else if (tab === 'groups' && referenceId) {
      setTargetGroupId(referenceId);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* 1. Persistent Top-Level Header with Real-Time Notification Bell */}
      <Header onNavigate={handleHeaderNavigate} />

      {/* 2. Workspace Body: Left Sidebar + Active Viewport */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'directory' && (
            <Directory onStartChat={handleStartDirectChat} />
          )}

          {activeTab === 'mustread' && <MustRead />}

          {activeTab === 'messages' && (
            <DirectChat
              targetUserId={targetUserId}
              onSelectUser={setTargetUserId}
            />
          )}

          {activeTab === 'groups' && (
            <GroupChat
              targetGroupId={targetGroupId}
              onSelectGroup={setTargetGroupId}
            />
          )}

          {activeTab === 'relax' && <Relax />}

          {activeTab === 'admin' && user.role === 'Admin' && <AdminPanel />}
        </main>
      </div>
    </div>
  );
}


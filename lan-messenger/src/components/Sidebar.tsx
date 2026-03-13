import React, { useState } from 'react';
import { User } from '../types';
import { Users, User as UserIcon, Circle, ChevronDown, Search, MoreVertical, MessageSquare, Paperclip, Rss, UserPlus, Users as UsersGroup } from 'lucide-react';

interface SidebarProps {
  users: User[];
  currentUserId: string | undefined;
  activeChat: string | null;
  setActiveChat: (id: string | null) => void;
  me?: User;
  onUpdateProfile: (status?: string, note?: string) => void;
  typingUsers: Record<string, string | null>;
}

export default function Sidebar({ users, currentUserId, activeChat, setActiveChat, me, onUpdateProfile, typingUsers }: SidebarProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isGeneralCollapsed, setIsGeneralCollapsed] = useState(false);
  const [note, setNote] = useState(me?.note || '');
  const otherUsers = users.filter(u => u.id !== currentUserId);

  const handleNoteBlur = () => {
    onUpdateProfile(undefined, note);
  };

  const isAnyoneTypingInPublic = Object.keys(typingUsers).some(id => typingUsers[id] === null && id !== currentUserId);

  return (
    <div className="w-full md:w-[300px] bg-[#f0f0f0] flex flex-col border-r border-gray-300 select-none h-full">
      {/* Menu Bar */}
      <div className="flex px-2 py-1 text-xs text-gray-700 space-x-4 border-b border-gray-200 bg-white">
        <button className="hover:text-blue-600">Messenger</button>
        <button className="hover:text-blue-600">Tools</button>
        <button className="hover:text-blue-600">Help</button>
      </div>

      {/* Profile Section */}
      <div className="p-3 bg-white border-b border-gray-200">
        <div className="flex items-start">
          <div className="relative">
            <img 
              src={me?.avatar} 
              alt="My Avatar" 
              className="w-14 h-14 rounded border border-gray-300 shadow-sm" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-gray-800">{me?.username}</span>
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="Type a note"
              className="w-full mt-1 text-xs text-gray-500 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none py-0.5"
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-around p-1 bg-white border-b border-gray-200">
        <button className="p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300 transition-all">
          <MessageSquare className="w-5 h-5 text-gray-400" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300 transition-all">
          <Paperclip className="w-5 h-5 text-gray-400" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300 transition-all">
          <Rss className="w-5 h-5 text-blue-500" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300 transition-all">
          <UserPlus className="w-5 h-5 text-green-600" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300 transition-all">
          <UsersGroup className="w-5 h-5 text-blue-600" />
        </button>
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {/* General Group */}
        <button 
          onClick={() => setIsGeneralCollapsed(!isGeneralCollapsed)}
          className="w-full bg-blue-600 text-white px-2 py-1 text-xs font-bold flex items-center hover:bg-blue-700 transition-colors"
        >
          <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${isGeneralCollapsed ? '-rotate-90' : ''}`} />
          General
        </button>
        
        {!isGeneralCollapsed && (
          <div className="bg-white">
            <button
              onClick={() => setActiveChat(null)}
              className={`w-full flex items-center px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                activeChat === null ? 'bg-blue-100' : ''
              }`}
            >
              <Users className="w-5 h-5 mr-3 text-blue-500" />
              <div className="flex-1 text-left">
                <div className="text-sm font-bold text-gray-800">Public Chat Room</div>
                <div className="text-xs text-gray-500">
                  {isAnyoneTypingInPublic ? (
                    <span className="text-blue-600 font-medium animate-pulse">Someone is typing...</span>
                  ) : (
                    'Broadcast to everyone'
                  )}
                </div>
              </div>
            </button>

            {otherUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setActiveChat(user.id)}
                className={`w-full flex items-center px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 group ${
                  activeChat === user.id ? 'bg-blue-100' : ''
                }`}
              >
                <div className="relative mr-3">
                  <img 
                    src={user.avatar} 
                    alt={user.username} 
                    className="w-10 h-10 rounded border border-gray-200" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="text-sm font-bold text-gray-800 truncate">{user.username}</div>
                  <div className="text-xs text-gray-500 truncate italic">
                    {typingUsers[user.id] !== undefined ? (
                      <span className="text-blue-600 font-medium animate-pulse">
                        {typingUsers[user.id] === null ? 'Typing in Public...' : 'Typing to you...'}
                      </span>
                    ) : (
                      user.note
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

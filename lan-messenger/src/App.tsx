import React, { useState, useEffect, useRef } from 'react';
import { socket } from './socket';
import { User, Message } from './types';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { AVATARS, LOGO_URL } from './constants';
import { ChevronDown, User as UserIcon, ArrowLeft, Settings } from 'lucide-react';

const ENCRYPTION_KEY = 'lan-messenger-secret-key-123';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null); // null = public chat
  const [isJoined, setIsJoined] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');
  const [typingUsers, setTypingUsers] = useState<Record<string, string | null>>({});
  const [myNote, setMyNote] = useState('');
  const [logoUrl, setLogoUrl] = useState(LOGO_URL);

  useEffect(() => {
    // Fetch settings for logo
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && data.logo_url) {
          setLogoUrl(data.logo_url);
        } else if (data && data.error) {
          console.error('Settings API error:', data.error, data.details);
        }
      })
      .catch(err => console.error('Failed to fetch settings', err));

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onUsers(usersList: User[]) {
      setUsers(usersList);
    }

    function onReceiveMessage(message: Message) {
      try {
        if (message.type === 'text' && message.content) {
          const bytes = CryptoJS.AES.decrypt(message.content, ENCRYPTION_KEY);
          message.content = bytes.toString(CryptoJS.enc.Utf8);
        }
      } catch (e) {
        console.error('Failed to decrypt message', e);
      }
      
      setMessages((prev) => [...prev, message]);
      
      if (message.senderId !== socket.id) {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
        
        if (Notification.permission === 'granted') {
          new Notification(`New message from ${message.senderName}`, {
            body: message.type === 'text' ? message.content : 'Sent a file'
          });
        }
      }
    }

    function onHistory(history: Message[]) {
      const decryptedHistory = history.map(msg => {
        try {
          if (msg.type === 'text' && msg.content) {
            const bytes = CryptoJS.AES.decrypt(msg.content, ENCRYPTION_KEY);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (decrypted) {
              return { ...msg, content: decrypted };
            }
          }
        } catch (e) {
          console.error('Failed to decrypt history message', e);
        }
        return msg;
      });
      setMessages(decryptedHistory);
    }

    function onUserTyping(data: { senderId: string, receiverId: string | null, isTyping: boolean }) {
      setTypingUsers(prev => {
        const next = { ...prev };
        if (data.isTyping) {
          next[data.senderId] = data.receiverId;
        } else {
          delete next[data.senderId];
        }
        return next;
      });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('users', onUsers);
    socket.on('receive_message', onReceiveMessage);
    socket.on('history', onHistory);
    socket.on('user_typing', onUserTyping);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('users', onUsers);
      socket.off('receive_message', onReceiveMessage);
      socket.off('history', onHistory);
      socket.off('user_typing', onUserTyping);
    };
  }, []);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleJoin = (userData: any) => {
    setCurrentUser(userData);
    socket.connect();
    socket.emit('join', { username: userData.username, avatar: userData.avatar });
    setIsJoined(true);
  };

  const handleSendMessage = (content: string, type: 'text' | 'file' = 'text', fileData?: any) => {
    let encryptedContent = content;
    if (type === 'text') {
      encryptedContent = CryptoJS.AES.encrypt(content, ENCRYPTION_KEY).toString();
    }

    const newMessage = {
      id: uuidv4(),
      receiverId: activeChat,
      content: encryptedContent,
      type,
      timestamp: new Date().toISOString(),
      ...fileData
    };

    socket.emit('send_message', newMessage);
  };

  const updateProfile = (status?: string, note?: string) => {
    socket.emit('update_profile', { status, note });
  };

  if (!isJoined) {
    return <Login onJoin={handleJoin} logoUrl={logoUrl} />;
  }

  const filteredMessages = messages.filter(msg => {
    if (activeChat === null) {
      return msg.receiverId === null; // Public messages
    }
    return (msg.senderId === socket.id && msg.receiverId === activeChat) ||
           (msg.senderId === activeChat && msg.receiverId === socket.id);
  });

  const activeUser = activeChat ? users.find(u => u.id === activeChat) : null;
  const me = users.find(u => u.id === socket.id);

  const handleSelectChat = (id: string | null) => {
    setActiveChat(id);
    setMobileView('chat');
  };

  return (
    <div className="flex h-screen bg-[#f0f0f0] text-gray-900 overflow-hidden font-sans relative">
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
        <Sidebar 
          users={users} 
          currentUserId={socket.id} 
          activeChat={activeChat} 
          setActiveChat={handleSelectChat}
          me={me}
          onUpdateProfile={updateProfile}
          typingUsers={typingUsers}
        />
      </div>
      
      <div className={`${mobileView === 'sidebar' ? 'hidden' : 'flex'} flex-1 flex flex-col bg-white border-l border-gray-300`}>
        {/* Header */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4 bg-white">
          <button 
            onClick={() => setMobileView('sidebar')}
            className="md:hidden mr-3 p-1 hover:bg-gray-100 rounded"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {activeChat === null ? (
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center mr-3 overflow-hidden">
                <img src={logoUrl} alt="Public" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold">General</h2>
                <p className="text-xs text-gray-500">Public Chat Room</p>
              </div>
              {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => setShowAdmin(true)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                  title="Admin Panel"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center w-full">
              <img src={activeUser?.avatar} alt="Avatar" className="w-10 h-10 rounded mr-3 border border-gray-200" referrerPolicy="no-referrer" />
              <div className="flex-1">
                <h2 className="text-base font-bold">{activeUser?.username}</h2>
                <p className="text-xs text-gray-500 italic">{activeUser?.note || 'No note'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <ChatWindow 
          messages={filteredMessages} 
          currentUserId={socket.id}
          typingUsers={Object.keys(typingUsers).filter(id => {
          if (activeChat === null) return typingUsers[id] === null;
          return id === activeChat && typingUsers[id] === socket.id;
        })}
          users={users}
        />

        {/* Input Area */}
        <MessageInput 
          onSendMessage={handleSendMessage} 
          activeChat={activeChat}
        />
      </div>

      {showAdmin && (
        <AdminDashboard 
          onClose={() => setShowAdmin(false)} 
          onLogoUpdate={(url) => setLogoUrl(url)}
        />
      )}
    </div>
  );
}

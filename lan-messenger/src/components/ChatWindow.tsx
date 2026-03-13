import React, { useEffect, useRef } from 'react';
import { Message, User } from '../types';
import { format } from 'date-fns';
import { FileText, Download, User as UserIcon } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string | undefined;
  typingUsers: string[];
  users: User[];
}

export default function ChatWindow({ messages, currentUserId, typingUsers, users }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  const getUsername = (id: string) => {
    return users.find(u => u.id === id)?.username || 'Unknown User';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white" ref={scrollRef}>
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <UserIcon className="w-8 h-8" />
          </div>
          <p className="text-sm">No messages yet. Start the conversation!</p>
        </div>
      )}

      {messages.map((msg, index) => {
        const isMe = msg.senderId === currentUserId;
        return (
          <div
            key={msg.id || index}
            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMe && (
                <img 
                  src={msg.senderAvatar} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded mt-1 shadow-sm border border-gray-200" 
                  referrerPolicy="no-referrer"
                />
              )}
              <div className={`mx-2 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[11px] font-bold text-gray-600">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {format(new Date(msg.timestamp), 'HH:mm')}
                  </span>
                </div>
                
                <div
                  className={`px-3 py-2 rounded-lg shadow-sm border ${
                    isMe
                      ? 'bg-blue-50 border-blue-100 text-gray-800'
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  {msg.type === 'text' ? (
                    <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  ) : (
                    <div className="flex items-center space-x-3 p-1">
                      <div className="w-10 h-10 bg-white rounded border border-gray-200 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {msg.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(msg.fileSize! / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <a
                        href={msg.content}
                        download={msg.fileName}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {typingUsers.length > 0 && (
        <div className="flex items-center space-x-2 text-xs text-gray-400 italic animate-pulse">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
          <span>
            {typingUsers.map(id => getUsername(id)).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}
    </div>
  );
}

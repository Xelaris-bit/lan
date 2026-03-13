import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Image as ImageIcon, Mic, Phone, Video, MoreHorizontal } from 'lucide-react';
import { socket } from '../socket';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'file', fileData?: any) => void;
  activeChat: string | null;
}

export default function MessageInput({ onSendMessage, activeChat }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      stopTyping();
    }
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socket.emit('typing', { receiverId: activeChat, isTyping: false });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { receiverId: activeChat, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onSendMessage(data.url, 'file', {
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
        });
      }
    } catch (error) {
      console.error('Upload failed', error);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="p-3 bg-white border-t border-gray-200">
      {/* Action Bar */}
      <div className="flex items-center space-x-4 mb-2 px-1 border-b border-gray-100 pb-2">
        <button className="text-gray-500 hover:text-blue-600 transition-colors p-1 hover:bg-gray-100 rounded" title="Font">
          <span className="font-serif font-bold text-sm">A</span>
        </button>
        <button className="text-gray-500 hover:text-blue-600 transition-colors p-1 hover:bg-gray-100 rounded" title="Emoticons">
          <Smile className="w-5 h-5" />
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-500 hover:text-blue-600 transition-colors p-1 hover:bg-gray-100 rounded"
          title="Attach File"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <div className="flex-1" />
      </div>

      <form onSubmit={handleSend} className="flex flex-col">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full h-24 p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400 resize-none bg-white text-gray-800"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!message.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-bold py-1.5 px-8 rounded shadow transition-colors flex items-center"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

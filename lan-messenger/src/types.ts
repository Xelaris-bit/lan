export interface User {
  id: string;
  username: string;
  avatar: string;
  status: 'Available' | 'Busy' | 'Away' | 'Offline';
  note?: string;
  email?: string;
  role?: 'admin' | 'user';
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string | null;
  content: string;
  type: 'text' | 'file';
  timestamp: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

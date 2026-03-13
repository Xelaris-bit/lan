import React, { useState, useEffect } from 'react';
import { User, Trash2, Edit2, Plus, X, Save, Settings as SettingsIcon, Image as ImageIcon } from 'lucide-react';

interface UserData {
  _id: string;
  email: string;
  username: string;
  avatar: string;
  role: string;
}

export default function AdminDashboard({ onClose, onLogoUpdate }: { onClose: () => void, onLogoUpdate?: (url: string) => void }) {
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [editingUser, setEditingUser] = useState<Partial<UserData> | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    avatar: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.logo_url) setLogoUrl(data.logo_url);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const handleUpdateLogo = async () => {
    setIsUpdating(true);
    setError('');
    setSuccessMessage('');
    console.log('Updating logo with URL:', logoUrl);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'logo_url', value: logoUrl })
      });
      console.log('Update response status:', res.status);
      if (res.ok) {
        setSuccessMessage('Logo updated successfully!');
        setUpdateSuccess(true);
        if (onLogoUpdate) onLogoUpdate(logoUrl);
        console.log('Success message set: Logo updated successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          setUpdateSuccess(false);
        }, 8000);
      } else {
        const data = await res.json();
        setError('Failed to update logo: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Update logo error:', err);
      setError('Failed to update logo due to connection error');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser?._id ? `/api/admin/users/${editingUser._id}` : '/api/admin/users';
    const method = editingUser?._id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      fetchUsers();
      setEditingUser(null);
      setIsAdding(false);
      setFormData({ email: '', password: '', username: '', avatar: '', role: 'user' });
    }
  };

  const handleDelete = async (user: UserData) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    await fetch(`/api/admin/users/${userToDelete._id}`, { method: 'DELETE' });
    setUserToDelete(null);
    fetchUsers();
  };

  console.log('AdminDashboard state:', { activeTab, successMessage, error, isUpdating, updateSuccess });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      {/* Global Toast Messages */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-none">
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between pointer-events-auto mb-3 border border-red-500">
            <div className="flex items-center">
              <X className="w-5 h-5 mr-3" />
              <span className="font-bold text-sm">{error}</span>
            </div>
            <button onClick={() => setError('')} className="ml-4">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between pointer-events-auto border border-green-500">
            <div className="flex items-center">
              <Save className="w-5 h-5 mr-3" />
              <span className="font-bold text-sm">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="ml-4">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-600 text-white rounded-t-lg">
          <h2 className="font-bold text-lg flex items-center">
            <SettingsIcon className="w-5 h-5 mr-2" />
            Admin Control Panel
          </h2>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 bg-gray-50">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 text-sm font-bold flex items-center transition-colors ${activeTab === 'users' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <User className="w-4 h-4 mr-2" />
            User Management
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-sm font-bold flex items-center transition-colors ${activeTab === 'settings' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            App Settings
          </button>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 flex-1 overflow-y-auto">
            {activeTab === 'users' ? (
              <>
                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-gray-500 text-sm font-medium">Manage all registered users</h3>
                  <button 
                    onClick={() => { setIsAdding(true); setEditingUser(null); }}
                    className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded flex items-center justify-center hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New User
                  </button>
                </div>

                {(isAdding || editingUser) && (
                  <form onSubmit={handleSave} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Email</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Password</label>
                        <input 
                          type="password" 
                          required={!editingUser}
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                          className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:border-blue-500"
                          placeholder={editingUser ? '(Leave blank to keep current)' : ''}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Username</label>
                        <input 
                          type="text" 
                          required
                          value={formData.username}
                          onChange={e => setFormData({...formData, username: e.target.value})}
                          className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Avatar</label>
                        <div className="flex items-center mt-1 space-x-2">
                          <img src={formData.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} className="w-10 h-10 rounded border shrink-0" referrerPolicy="no-referrer" />
                          <input 
                            type="text" 
                            value={formData.avatar}
                            onChange={e => setFormData({...formData, avatar: e.target.value})}
                            placeholder="Avatar URL"
                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm min-w-0"
                          />
                          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded border border-gray-300 flex items-center justify-center min-w-[40px] shrink-0">
                            <Plus className="w-4 h-4 text-gray-600" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const formDataUpload = new FormData();
                                    formDataUpload.append('file', file);
                                    const res = await fetch('/api/upload', {
                                      method: 'POST',
                                      body: formDataUpload
                                    });
                                    const data = await res.json();
                                    if (res.ok && data.url) {
                                      setFormData(prev => ({ ...prev, avatar: data.url }));
                                    } else {
                                      setError('Upload failed: ' + (data.error || 'Unknown error'));
                                    }
                                  } catch (err) {
                                    console.error('Upload error:', err);
                                    setError('Connection error during upload');
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                      <button 
                        type="button"
                        onClick={() => { setIsAdding(false); setEditingUser(null); }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded order-2 sm:order-1"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded flex items-center justify-center hover:bg-blue-700 order-1 sm:order-2"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save User
                      </button>
                    </div>
                  </form>
                )}

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="p-3 text-sm font-bold text-gray-600">User</th>
                        <th className="p-3 text-sm font-bold text-gray-600">Email</th>
                        <th className="p-3 text-sm font-bold text-gray-600">Role</th>
                        <th className="p-3 text-sm font-bold text-gray-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 flex items-center">
                            <img src={user.avatar} className="w-8 h-8 rounded mr-3 shrink-0" referrerPolicy="no-referrer" />
                            <span className="font-medium truncate">{user.username}</span>
                          </td>
                          <td className="p-3 text-sm text-gray-600 truncate max-w-[200px]">{user.email}</td>
                          <td className="p-3">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <button 
                              onClick={() => {
                                setEditingUser(user);
                                setFormData({
                                  email: user.email,
                                  password: '',
                                  username: user.username,
                                  avatar: user.avatar,
                                  role: user.role
                                });
                                setIsAdding(false);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded mr-1"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(user)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {users.map(user => (
                    <div key={user._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <img src={user.avatar} className="w-10 h-10 rounded mr-3" referrerPolicy="no-referrer" />
                          <div>
                            <div className="font-bold text-gray-900">{user.username}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        <button 
                          onClick={() => {
                            setEditingUser(user);
                            setFormData({
                              email: user.email,
                              password: '',
                              username: user.username,
                              avatar: user.avatar,
                              role: user.role
                            });
                            setIsAdding(false);
                          }}
                          className="flex items-center text-sm text-blue-600 font-medium px-3 py-1.5 hover:bg-blue-50 rounded border border-blue-100"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(user)}
                          className="flex items-center text-sm text-red-600 font-medium px-3 py-1.5 hover:bg-red-50 rounded border border-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="max-w-2xl mx-auto py-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Branding Settings
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Application Logo</label>
                      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 w-full space-y-3">
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <input 
                              type="text" 
                              value={logoUrl}
                              onChange={(e) => setLogoUrl(e.target.value)}
                              placeholder="Enter Logo URL"
                              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg border border-blue-200 flex items-center justify-center font-bold text-sm transition-colors whitespace-nowrap">
                              Upload File
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const formDataUpload = new FormData();
                                      formDataUpload.append('file', file);
                                      const res = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: formDataUpload
                                      });
                                      const data = await res.json();
                                      if (res.ok && data.url) {
                                        setLogoUrl(data.url);
                                        setSuccessMessage('File uploaded! Click "Update Logo" to save changes.');
                                      } else {
                                        setError('Upload failed: ' + (data.error || 'Unknown error'));
                                      }
                                    } catch (err) {
                                      setError('Connection error during upload');
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 text-center sm:text-left">
                            Recommended size: 512x512px. Supports PNG, JPG, and SVG.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-center sm:justify-end">
                      <button 
                        onClick={handleUpdateLogo}
                        disabled={isUpdating}
                        className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center ${
                          updateSuccess 
                            ? 'bg-green-600 text-white shadow-green-200' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                        }`}
                      >
                        {isUpdating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Updating...
                          </>
                        ) : updateSuccess ? (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Updated!
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Update Logo
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-sm text-center text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-bold text-gray-900">{userToDelete.username}</span>? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors order-1 sm:order-2"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

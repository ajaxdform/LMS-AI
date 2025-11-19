import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

// Avatar options with cartoon style
const AVATARS = [
  { id: 'avatar1', emoji: '😊', name: 'Happy', color: 'bg-blue-100' },
  { id: 'avatar2', emoji: '🎓', name: 'Graduate', color: 'bg-purple-100' },
  { id: 'avatar3', emoji: '🚀', name: 'Rocket', color: 'bg-red-100' },
  { id: 'avatar4', emoji: '🌟', name: 'Star', color: 'bg-yellow-100' },
  { id: 'avatar5', emoji: '🎨', name: 'Artist', color: 'bg-pink-100' },
  { id: 'avatar6', emoji: '💻', name: 'Developer', color: 'bg-green-100' },
  { id: 'avatar7', emoji: '📚', name: 'Bookworm', color: 'bg-indigo-100' },
  { id: 'avatar8', emoji: '🎯', name: 'Target', color: 'bg-orange-100' },
  { id: 'avatar9', emoji: '🦄', name: 'Unicorn', color: 'bg-purple-100' },
  { id: 'avatar10', emoji: '🔥', name: 'Fire', color: 'bg-red-100' },
  { id: 'avatar11', emoji: '⚡', name: 'Lightning', color: 'bg-yellow-100' },
  { id: 'avatar12', emoji: '🌈', name: 'Rainbow', color: 'bg-pink-100' },
];

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    avatar: 'avatar1',
    bio: '',
    phoneNumber: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me');
      const userData = response.data.data;
      setUser(userData);
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        avatar: userData.avatar || 'avatar1',
        bio: userData.bio || '',
        phoneNumber: userData.phoneNumber || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarSelect = (avatarId) => {
    setFormData(prev => ({
      ...prev,
      avatar: avatarId
    }));
    setShowAvatarPicker(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', {
        username: formData.username,
        avatar: formData.avatar,
        bio: formData.bio,
        phoneNumber: formData.phoneNumber
      });
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      avatar: user.avatar || 'avatar1',
      bio: user.bio || '',
      phoneNumber: user.phoneNumber || ''
    });
  };

  const getAvatarInfo = (avatarId) => {
    return AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentAvatar = getAvatarInfo(formData.avatar);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 relative">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full ${currentAvatar.color} flex items-center justify-center text-6xl border-4 border-white shadow-lg`}>
                {currentAvatar.emoji}
              </div>
              {editing && (
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="absolute bottom-0 right-0 bg-white text-blue-600 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                  title="Change Avatar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-white">{user?.username}</h1>
              <p className="text-blue-100 mt-1">{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  user?.role === 'ADMIN' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {user?.role || 'STUDENT'}
                </span>
                <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-semibold">
                  {user?.enrolledCourseIds?.length || 0} Courses Enrolled
                </span>
              </div>
            </div>
            <div className="ml-auto">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              {editing ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your username"
                />
              ) : (
                <p className="text-gray-900 text-lg">{user?.username}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <p className="text-gray-900 text-lg flex items-center gap-2">
                {user?.email}
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">(Cannot be changed)</span>
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="text-gray-900 text-lg">{user?.phoneNumber || 'Not provided'}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bio
              </label>
              {editing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-900 text-lg">{user?.bio || 'No bio added yet'}</p>
              )}
            </div>

            {/* Account Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Account Type</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {user?.role === 'ADMIN' ? 'Administrator' : 'Student'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="mt-8 flex justify-end gap-3 pt-6 border-t">
              <button
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Avatar</h2>
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 grid grid-cols-3 sm:grid-cols-4 gap-4">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  className={`relative p-4 rounded-xl transition-all transform hover:scale-105 ${
                    formData.avatar === avatar.id
                      ? 'ring-4 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-full aspect-square ${avatar.color} rounded-lg flex items-center justify-center text-4xl mb-2`}>
                    {avatar.emoji}
                  </div>
                  <p className="text-sm font-medium text-gray-700 text-center">{avatar.name}</p>
                  {formData.avatar === avatar.id && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

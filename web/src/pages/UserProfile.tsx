import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { User } from '../types';
import { useForm } from 'react-hook-form';
import { Camera, User as UserIcon } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000';

export default function UserProfile() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Partial<User>>({
    defaultValues: {
      full_name: user?.full_name,
      email: user?.email,
      phone_number: user?.phone_number,
    }
  });

  const onSubmit = async (_data: Partial<User>) => {
    try {
      if (!user) return;
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 5MB.' });
      return;
    }

    setUploading(true);
    try {
      const result = await api.uploadUserPhoto(file);
      const updatedUser = { ...user, profile_photo_url: result.url };
      setUser(updatedUser);
      localStorage.setItem('sanctus_user', JSON.stringify(updatedUser));
      setMessage({ type: 'success', text: 'Profile photo updated!' });
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setMessage({ type: 'error', text: 'Failed to upload photo' });
    } finally {
      setUploading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  const photoUrl = user.profile_photo_url
    ? `${API_BASE_URL}${user.profile_photo_url}`
    : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {message && (
        <div className={`p-4 rounded-md mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Photo */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-6 flex items-center gap-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt={user.full_name} className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <UserIcon size={40} className="text-gray-400" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all cursor-pointer"
            >
              <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
            <p className="text-sm text-gray-500">{user.role.replace(/_/g, ' ')}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {uploading && <p className="text-xs text-primary-600 mt-1">Uploading photo...</p>}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  {...register('full_name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  {...register('email')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  {...register('phone_number')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <span className="text-sm font-medium text-gray-500">Full Name</span>
                <span className="col-span-2 text-sm text-gray-900">{user.full_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <span className="text-sm font-medium text-gray-500">Email</span>
                <span className="col-span-2 text-sm text-gray-900">{user.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <span className="text-sm font-medium text-gray-500">Phone</span>
                <span className="col-span-2 text-sm text-gray-900">{user.phone_number || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <span className="text-sm font-medium text-gray-500">Role</span>
                <span className="col-span-2 text-sm text-gray-900">{user.role.replace(/_/g, ' ')}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="text-sm font-medium text-gray-500">Username</span>
                <span className="col-span-2 text-sm text-gray-900">{user.username}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

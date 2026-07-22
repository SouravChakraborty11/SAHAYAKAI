import React, { useState, useRef } from 'react';
import { Upload, Trash2, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import { apiUploadProfilePhoto, apiDeleteProfilePhoto } from '../../core/api';
import { useTranslation } from 'react-i18next';

interface ProfilePhotoUploadProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ onSuccess, onError }) => {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const getAvatarUrl = () => {
    if (preview) return preview;
    if (user?.avatar_url) return `http://127.0.0.1:8000${user.avatar_url}`;
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError(t('profilePhoto.errSize'));
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onError(t('profilePhoto.errFormat'));
      return;
    }

    // Create square crop using canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Center crop
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        
        ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);
        
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const croppedFile = new File([blob], file.name, { type: file.type });
          const previewUrl = URL.createObjectURL(blob);
          setPreview(previewUrl);
          
          // Auto upload
          await handleUpload(croppedFile);
        }, file.type);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const updatedUser = await apiUploadProfilePhoto(file);
      updateUser(updatedUser);
      onSuccess(t('profilePhoto.successUpdate'));
      setPreview(null);
    } catch (err: any) {
      onError(err.message || t('profilePhoto.errUpload'));
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsUploading(true);
    try {
      const updatedUser = await apiDeleteProfilePhoto();
      updateUser(updatedUser);
      onSuccess(t('profilePhoto.successRemove'));
      setPreview(null);
    } catch (err: any) {
      onError(err.message || t('profilePhoto.errRemove'));
    } finally {
      setIsUploading(false);
    }
  };

  const avatarUrl = getAvatarUrl();

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 p-6 bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-100 dark:border-gray-800 shadow-sm mb-8">
      {/* Avatar Container */}
      <div className="relative group shrink-0">
        <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 shadow-md flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${isUploading ? 'opacity-50' : ''}`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-4xl">
              {user?.full_name ? user.full_name[0].toUpperCase() : <User className="w-12 h-12" />}
            </div>
          )}
        </div>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#2E7D32] animate-spin" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('profilePhoto.title')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">{t('profilePhoto.desc')}</p>
        
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {t('profilePhoto.upload')}
          </button>
          
          {user?.avatar_url && !preview && (
            <button
              onClick={handleDelete}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-red-600 font-bold border-2 border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {t('profilePhoto.remove')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

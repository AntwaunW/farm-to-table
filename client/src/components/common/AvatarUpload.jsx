import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './AvatarUpload.scss';

const AvatarUpload = () => {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const avatarUrl = uploadRes.data.url;

      await api.put('/auth/avatar', { avatarUrl });
      updateUser({ avatar: avatarUrl });
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="avatar-upload">
      <label className="avatar-upload__circle" htmlFor="avatar-file-input" title="Change profile photo">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="avatar-upload__img" />
        ) : (
          <span className="avatar-upload__initials">{initials}</span>
        )}
        <div className="avatar-upload__overlay">
          {uploading
            ? <span className="avatar-upload__spinner" />
            : <span className="avatar-upload__camera" aria-hidden="true">📷</span>
          }
        </div>
      </label>

      <input
        id="avatar-file-input"
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="avatar-upload__input"
        disabled={uploading}
      />

      {error && <p className="avatar-upload__error">{error}</p>}
    </div>
  );
};

export default AvatarUpload;

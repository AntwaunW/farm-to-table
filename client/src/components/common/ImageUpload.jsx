// ImageUpload component — reusable image upload input
// Used on CreateFarm and CreateListing pages
// Sends the image to our backend which uploads it to Cloudinary
// Returns the Cloudinary URL to the parent component via onUpload prop

import { useState } from 'react';
import api from '../../utils/api';
import './ImageUpload.scss';

const ImageUpload = ({ onUpload, label = 'Upload image' }) => {
  // -------------------------------------------------------------------
  // 🎓 WHAT ARE THESE STATE VARIABLES FOR?
  // preview — shows a small preview of the selected image before upload
  // uploading — shows a loading state while the image is being sent
  // error — shows an error if something goes wrong
  //
  // Think of preview like holding up a polaroid photo before you
  // decide to frame it. You see what it looks like first.
  // -------------------------------------------------------------------
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // -------------------------------------------------------------------
  // 🎓 WHAT IS handleFileChange?
  // When the user selects a file from their computer this function runs.
  //
  // e.target.files[0] gets the first selected file.
  // FileReader reads the file and converts it to a data URL —
  // a base64 encoded string that browsers can display as an image.
  // This gives us an instant preview without uploading yet.
  //
  // Then we immediately upload to our backend.
  // -------------------------------------------------------------------
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');

    // Show a local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to backend
    setUploading(true);
    try {
      // -------------------------------------------------------------------
      // 🎓 WHAT IS FormData?
      // When sending files over HTTP we can't just send JSON.
      // Files need to be sent as multipart/form-data — a special
      // format that can include binary data like images.
      //
      // FormData is a built-in browser object that handles this.
      // Think of it like a special envelope designed to hold
      // both text AND attachments — like an email with a photo attached.
      // -------------------------------------------------------------------
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Pass the Cloudinary URL back to the parent component
      onUpload(res.data.url);
    } catch (err) {
      setError('Upload failed. Please try again.');
      setPreview('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <label className="image-upload__label">{label}</label>

      {/* -------------------------------------------------------------------
      🎓 THE HIDDEN INPUT TRICK
      The default HTML file input is ugly and hard to style.
      A common professional trick is to hide it and create a
      nice looking button that triggers it when clicked.
      htmlFor on the label connects it to the input via the id.
      Clicking the label triggers the hidden input.
      ------------------------------------------------------------------- */}
      <label className="image-upload__dropzone" htmlFor="image-input">
        {preview ? (
          // Show preview if image is selected
          <img
            src={preview}
            alt="Preview"
            className="image-upload__preview"
          />
        ) : (
          // Show upload prompt if no image selected
          <div className="image-upload__prompt">
            <span className="image-upload__icon">📷</span>
            <span className="image-upload__text">
              {uploading ? 'Uploading...' : 'Click to upload image'}
            </span>
            <span className="image-upload__hint">
              JPG, PNG up to 5MB
            </span>
          </div>
        )}
      </label>

      {/* Hidden file input */}
      <input
        id="image-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="image-upload__input"
        disabled={uploading}
      />

      {/* Loading indicator */}
      {uploading && (
        <p className="image-upload__uploading">Uploading to cloud...</p>
      )}

      {/* Error message */}
      {error && (
        <p className="image-upload__error">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;
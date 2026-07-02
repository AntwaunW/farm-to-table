// FarmGallery — lets a farmer manage their farm's photo gallery from the dashboard
//
// How it works:
//   1. The farmer clicks the "Add photo" cell
//   2. They pick an image file from their computer
//   3. We upload it to Cloudinary via our existing /api/upload endpoint
//   4. We send the returned Cloudinary URL to /api/farms/:id/photos to save it on the farm
//   5. The grid updates immediately without a page refresh
//   6. Each photo has an X button that calls /api/farms/:id/photos (DELETE) to remove it
//
// Props:
//   farmId        — the MongoDB _id of the farm
//   photos        — the current photos array from the farm document
//   onUpdate(arr) — callback so the parent (FarmerDashboard) can sync its local farm state

import { useState, useRef } from 'react';
import api from '../../utils/api';
import './FarmGallery.scss';

// Hard cap on how many photos a gallery can hold
const MAX_PHOTOS = 12;

const FarmGallery = ({ farmId, photos: initialPhotos, onUpdate }) => {
  // Local copy of the photos array — we update this after every server response
  const [photos, setPhotos] = useState(initialPhotos || []);

  // True while an upload is in progress — disables the input and shows a spinner
  const [uploading, setUploading] = useState(false);

  // Inline error message shown below the grid
  const [error, setError] = useState('');

  // Ref to the hidden file input so we can reset it after each upload
  const inputRef = useRef(null);

  // Helper that syncs both local state and notifies the parent at the same time
  const updatePhotos = (newPhotos) => {
    setPhotos(newPhotos);
    if (onUpdate) onUpdate(newPhotos);
  };

  // Called when the user picks a file from their computer
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      // Step 1 — Upload the raw image to Cloudinary via our backend upload route
      // The server returns a Cloudinary HTTPS URL we can store and display anywhere
      const formData = new FormData();
      formData.append('image', file);

      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Step 2 — Save the returned URL to this farm's photos array in MongoDB
      const res = await api.post(`/farms/${farmId}/photos`, {
        photoUrl: uploadRes.data.url,
      });

      updatePhotos(res.data.photos);
    } catch (err) {
      // Show the server's error message if there is one, otherwise a generic fallback
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset the file input so the same file can be selected again if needed
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  // Called when the farmer clicks the X on a photo thumbnail
  const handleRemove = async (photoUrl) => {
    setError('');
    try {
      // axios DELETE requests with a body need the body passed under { data: ... }
      const res = await api.delete(`/farms/${farmId}/photos`, {
        data: { photoUrl },
      });
      updatePhotos(res.data.photos);
    } catch (err) {
      setError('Failed to remove photo. Please try again.');
    }
  };

  // Disable the add button once we hit the cap
  const atLimit = photos.length >= MAX_PHOTOS;

  return (
    <div className="farm-gallery">

      {/* Inline error — shown above the grid if something goes wrong */}
      {error && <p className="farm-gallery__error">{error}</p>}

      <div className="farm-gallery__grid">

        {/* Render each uploaded photo as a square thumbnail */}
        {photos.map((url, index) => (
          <div key={url} className="farm-gallery__cell">
            <img
              src={url}
              alt={`Farm photo ${index + 1}`}
              className="farm-gallery__img"
            />

            {/* Remove button — appears on hover over the thumbnail */}
            <button
              className="farm-gallery__remove"
              onClick={() => handleRemove(url)}
              aria-label="Remove photo"
              type="button"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add-photo cell — hidden when the gallery is full */}
        {!atLimit && (
          <label
            className={`farm-gallery__add${uploading ? ' farm-gallery__add--loading' : ''}`}
            htmlFor="gallery-file-input"
            title="Add a photo"
          >
            {uploading ? (
              // Spinner shown while upload is in progress
              <span className="farm-gallery__spinner" />
            ) : (
              <>
                <span className="farm-gallery__plus">+</span>
                <span className="farm-gallery__add-label">Add photo</span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Hidden file input — triggered by clicking the label above */}
      <input
        id="gallery-file-input"
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="farm-gallery__input"
        disabled={uploading}
      />

      {/* Photo count shown below the grid */}
      <p className="farm-gallery__count">
        {photos.length} / {MAX_PHOTOS} photos
        {atLimit && ' · Remove a photo to add more'}
      </p>

    </div>
  );
};

export default FarmGallery;

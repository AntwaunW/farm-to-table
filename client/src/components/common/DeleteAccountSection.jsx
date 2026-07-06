// DeleteAccountSection — shared "danger zone" used by both FarmerDashboard
// and ConsumerDashboard. Deletion is a soft-delete on the server (see
// DELETE /api/auth/me): the account is anonymized and locked out, not
// erased, so past orders/reviews keep working. Requires re-entering the
// password plus an explicit confirm dialog before submitting, since this
// can't be undone from the UI.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import PasswordInput from './PasswordInput';
import './DeleteAccountSection.scss';

const DeleteAccountSection = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    setExpanded(false);
    setPassword('');
    setError('');
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');

    if (!window.confirm('This cannot be undone. Are you absolutely sure you want to permanently delete your account?')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete('/auth/me', { data: { password } });
      logout();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account.');
      setLoading(false);
    }
  };

  return (
    <div className="delete-account">
      <h2 className="delete-account__title">Danger zone</h2>

      {!expanded ? (
        <button
          type="button"
          className="delete-account__toggle"
          onClick={() => setExpanded(true)}
        >
          Delete account
        </button>
      ) : (
        <form className="delete-account__form" onSubmit={handleDelete}>
          <p className="delete-account__warning">
            This permanently deletes your account. Your name, email, and
            profile info will be removed
            {user?.role === 'farmer' && ' and your farm and listings will be taken down'}.
            This cannot be undone.
          </p>

          <div className="delete-account__field">
            <label className="delete-account__label">Enter your password to confirm</label>
            <PasswordInput
              className="delete-account__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          {error && <p className="delete-account__error">{error}</p>}

          <div className="delete-account__actions">
            <button
              type="button"
              className="delete-account__cancel-btn"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="delete-account__confirm-btn"
              disabled={loading || !password}
            >
              {loading ? 'Deleting...' : 'Permanently delete my account'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DeleteAccountSection;

// QuickSale — lets a farmer build an in-person "quick sale" for a walk-up customer
// (e.g. at a farmers market) and share a QR code / link so the customer can pay on
// their own phone, on the spot, without ever handing card details to the farmer

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import './QuickSale.scss';

// Stop polling for payment after this long — matches the server's own expiry
// sweep for abandoned quick sales, so an unattended tab doesn't poll forever
const MAX_POLL_MS = 45 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

const QuickSale = () => {
  const { user } = useAuth();

  const [farm, setFarm] = useState(null);
  const [listings, setListings] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [saleOrder, setSaleOrder] = useState(null);
  const [saleError, setSaleError] = useState('');
  const [copied, setCopied] = useState(false);

  const pollRef = useRef(null);
  const pollStartRef = useRef(null);

  const fetchListings = async (farmId) => {
    const res = await api.get(`/listings/farm/${farmId}`);
    setListings(res.data.listings.filter((l) => l.isAvailable && l.quantityAvailable > 0));
  };

  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        const farmsRes = await api.get('/farms');
        const myFarm = farmsRes.data.farms.find((f) => f.owner._id === user.id);
        if (myFarm) {
          setFarm(myFarm);
          await fetchListings(myFarm._id);
        }
      } catch (err) {
        setError('Failed to load your listings.');
      } finally {
        setLoading(false);
      }
    };
    fetchFarmerData();
  }, [user.id]);

  // Always clear the poll timer when this page goes away
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = (orderId) => {
    pollStartRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > MAX_POLL_MS) {
        clearInterval(pollRef.current);
        return;
      }
      try {
        const res = await api.get(`/orders/${orderId}`);
        setSaleOrder(res.data.order);
        if (res.data.order.paymentStatus === 'paid' || res.data.order.status === 'cancelled') {
          clearInterval(pollRef.current);
        }
      } catch {
        // Transient network hiccup — just try again on the next tick
      }
    }, POLL_INTERVAL_MS);
  };

  const handleQuantityChange = (listingId, maxQty, value) => {
    const qty = Math.max(0, Math.min(maxQty, Number(value) || 0));
    setQuantities({ ...quantities, [listingId]: qty });
  };

  const total = listings.reduce(
    (sum, l) => sum + (quantities[l._id] || 0) * l.pricePerUnit,
    0
  );

  const handleStartSale = async () => {
    setSaleError('');
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([listingId, quantity]) => ({ listingId, quantity }));

    if (items.length === 0) {
      setSaleError('Choose at least one item to sell.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/orders/quick-sale', { items });
      setSaleOrder(res.data.order);
      startPolling(res.data.order._id);
    } catch (err) {
      setSaleError(err.response?.data?.message || 'Failed to start sale.');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelSale = async () => {
    if (!saleOrder || !window.confirm('Cancel this sale?')) return;

    try {
      await api.put(`/orders/${saleOrder._id}/status`, { status: 'cancelled' });
      if (pollRef.current) clearInterval(pollRef.current);
      setSaleOrder(null);
      setQuantities({});
      await fetchListings(farm._id); // inventory was just restored
    } catch (err) {
      alert('Failed to cancel sale.');
    }
  };

  const handleNewSale = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setSaleOrder(null);
    setQuantities({});
    setSaleError('');
    setCopied(false);
    try {
      await fetchListings(farm._id);
    } catch {
      // Non-fatal — keep showing whatever listings we already have
    }
  };

  const handleCopyLink = (claimUrl) => {
    navigator.clipboard.writeText(claimUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Role check — only farmers can start a quick sale
  if (user?.role !== 'farmer') {
    return (
      <div className="quick-sale__error-page">
        <h2>Access Denied</h2>
        <p>Only farmers can start a quick sale.</p>
      </div>
    );
  }

  if (loading) return <div className="quick-sale__loading">Loading...</div>;
  if (error) return <div className="quick-sale__error">{error}</div>;

  if (!farm) {
    return (
      <div className="quick-sale">
        <div className="quick-sale__container">
          <p className="quick-sale__empty">
            You need a farm profile before you can make a quick sale.
          </p>
        </div>
      </div>
    );
  }

  const claimUrl = saleOrder ? `${window.location.origin}/quick-sale/${saleOrder._id}` : '';

  return (
    <div className="quick-sale">
      <div className="quick-sale__container">
        <h1 className="quick-sale__title">Quick Sale</h1>
        <p className="quick-sale__subtitle">
          Build a sale for a walk-up customer, then have them scan the code to
          pay on their own phone — right now, in front of you.
        </p>

        {!saleOrder ? (
          <>
            {listings.length === 0 ? (
              <p className="quick-sale__empty">No available listings to sell right now.</p>
            ) : (
              <div className="quick-sale__listings">
                {listings.map((listing) => (
                  <div key={listing._id} className="quick-sale__listing-row">
                    <div className="quick-sale__listing-info">
                      <h4>{listing.title}</h4>
                      <p>
                        ${listing.pricePerUnit} / {listing.unit} ·{' '}
                        {listing.quantityAvailable} available
                      </p>
                    </div>
                    <input
                      type="number"
                      className="quick-sale__qty-input"
                      min={0}
                      max={listing.quantityAvailable}
                      value={quantities[listing._id] || 0}
                      onChange={(e) =>
                        handleQuantityChange(listing._id, listing.quantityAvailable, e.target.value)
                      }
                      aria-label={`Quantity of ${listing.title}`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="quick-sale__total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {saleError && <p className="quick-sale__error-text">{saleError}</p>}

            <button
              className="quick-sale__start-btn"
              onClick={handleStartSale}
              disabled={creating || total <= 0}
              type="button"
            >
              {creating ? 'Starting sale...' : 'Start sale'}
            </button>
          </>
        ) : (
          <div className="quick-sale__active">
            <div className="quick-sale__qr-box">
              <QRCodeSVG value={claimUrl} size={220} />
            </div>

            <p className="quick-sale__link-label">Or share this link:</p>
            <div className="quick-sale__link-row">
              <input
                className="quick-sale__link-input"
                readOnly
                value={claimUrl}
                onFocus={(e) => e.target.select()}
              />
              <button
                className="quick-sale__copy-btn"
                onClick={() => handleCopyLink(claimUrl)}
                type="button"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="quick-sale__status">
              {saleOrder.paymentStatus === 'paid' ? (
                <p className="quick-sale__status--paid">✅ Paid — sale complete!</p>
              ) : saleOrder.status === 'cancelled' ? (
                <p className="quick-sale__status--cancelled">This sale was cancelled.</p>
              ) : (
                <p className="quick-sale__status--waiting">
                  ⏳ Waiting for the customer to pay...
                </p>
              )}
            </div>

            <div className="quick-sale__actions">
              {saleOrder.paymentStatus !== 'paid' && saleOrder.status !== 'cancelled' && (
                <button className="quick-sale__cancel-btn" onClick={handleCancelSale} type="button">
                  Cancel this sale
                </button>
              )}
              <button className="quick-sale__new-btn" onClick={handleNewSale} type="button">
                Start a new sale
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickSale;

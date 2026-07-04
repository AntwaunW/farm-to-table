// CartContext — manages the shopping cart state for the entire app
// Works exactly like AuthContext but for cart data instead of user data
// Any component can access the cart by calling useCart()
// Persists the cart to localStorage, scoped per logged-in user, so it survives
// a page refresh but never leaks from one account into another on the same browser

import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// Only logged-in consumers can ever add to a cart (see ListingCard/ListingDetail),
// so scoping by user id is enough — there's no legitimate anonymous cart to preserve
const getCartStorageKey = (userId) => `cartItems_${userId || 'guest'}`;

const loadCart = (userId) => {
  try {
    const stored = localStorage.getItem(getCartStorageKey(userId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    // Corrupted or unreadable storage — fall back to an empty cart rather than crashing
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  // -------------------------------------------------------------------
  // 🎓 WHAT DOES THE CART LOOK LIKE?
  // The cart is an array of items. Each item looks like this:
  // {
  //   listingId: '6a147d98...',
  //   title: 'Grass Fed Quarter Cow',
  //   pricePerUnit: 850,
  //   unit: 'quarter',
  //   quantity: 1,
  //   farmId: '6a1479b2...',
  //   farmName: 'Lone Star Ranch'
  // }
  //
  // We store farmId and farmName because an order belongs to ONE farm.
  // A consumer can't order from two different farms in one order.
  // -------------------------------------------------------------------
  // Initialize straight from localStorage so a refresh doesn't briefly show an empty cart
  const [cartItems, setCartItems] = useState(() => loadCart(user?.id));

  // Whenever the logged-in user changes (login, logout, or switching accounts),
  // reload the cart that belongs to that specific user instead of whatever
  // was left behind by whoever was using this browser before
  useEffect(() => {
    setCartItems(loadCart(user?.id));
  }, [user?.id]);

  // Keep localStorage in sync any time the cart changes, regardless of which
  // action caused it (add, remove, update quantity, clear)
  useEffect(() => {
    localStorage.setItem(getCartStorageKey(user?.id), JSON.stringify(cartItems));
  }, [cartItems, user?.id]);

  // -------------------------------------------------------------------
  // 🎓 addToCart
  // Adds a listing to the cart in the chosen quantity (defaults to 1).
  // If the item is already in the cart we increase the quantity by that amount.
  // If it's new we add it as a fresh item.
  //
  // Think of it like a physical shopping basket:
  // - First time you grab eggs → put a dozen in the basket
  // - Second time you grab eggs → add another dozen to what's there
  // -------------------------------------------------------------------
  const addToCart = (listing, farm, quantity = 1) => {
    setCartItems((prevItems) => {
      // Check if this listing is already in the cart
      const existingItem = prevItems.find(
        (item) => item.listingId === listing._id
      );

      if (existingItem) {
        // Already in cart — increase quantity by the amount chosen
        return prevItems.map((item) =>
          item.listingId === listing._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      // New item — add it to the cart
      return [
        ...prevItems,
        {
          listingId: listing._id,
          title: listing.title,
          pricePerUnit: listing.pricePerUnit,
          unit: listing.unit,
          quantity,
          farmId: farm._id,
          farmName: farm.farmName,
        },
      ];
    });
  };

  // -------------------------------------------------------------------
  // 🎓 removeFromCart
  // Removes an item completely from the cart using filter().
  // filter() keeps everything EXCEPT the item we want to remove.
  // -------------------------------------------------------------------
  const removeFromCart = (listingId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.listingId !== listingId)
    );
  };

  // -------------------------------------------------------------------
  // 🎓 updateQuantity
  // Changes the quantity of a specific item in the cart.
  // If quantity drops to 0 we remove the item entirely.
  // -------------------------------------------------------------------
  const updateQuantity = (listingId, quantity) => {
    if (quantity < 1) {
      removeFromCart(listingId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.listingId === listingId ? { ...item, quantity } : item
      )
    );
  };

  // -------------------------------------------------------------------
  // 🎓 clearCart
  // Empties the entire cart — called after an order is placed
  // -------------------------------------------------------------------
  const clearCart = () => setCartItems([]);

  // -------------------------------------------------------------------
  // 🎓 COMPUTED VALUES
  // These are values we calculate from cartItems on the fly.
  // We don't store them in state — we just calculate them when needed.
  //
  // cartCount — total number of items (used in Navbar badge)
  // cartTotal — total price of everything in the cart
  // cartFarmId — the farm all items belong to (orders are per farm)
  // -------------------------------------------------------------------
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.pricePerUnit * item.quantity,
    0
  );

  const cartFarmId = cartItems.length > 0 ? cartItems[0].farmId : null;
  const cartFarmName = cartItems.length > 0 ? cartItems[0].farmName : null;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        cartFarmId,
        cartFarmName,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook — same pattern as useAuth()
export const useCart = () => useContext(CartContext);

export default CartContext;
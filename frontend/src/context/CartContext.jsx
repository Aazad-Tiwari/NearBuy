import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { buyerAPI } from '../services/api';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'bopis_shopping_cart';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [shop, setShop] = useState(null); // The active shop object { _id, name, address, etc. }

  // Load cart on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.items && parsed.shop) {
          setCartItems(parsed.items);
          setShop(parsed.shop);
        }
      }
    } catch (err) {
      console.error('Failed to load cart from localStorage:', err);
    }
  }, []);

  // Save cart to local storage whenever it changes
  const saveCart = (items, activeShop) => {
    setCartItems(items);
    setShop(activeShop);
    if (items.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items, shop: activeShop }));
    }
  };

  /**
   * addToCart - adds an item or updates quantity
   */
  const addToCart = useCallback((product, quantity = 1, variantName = '') => {
    const productShop = product.shopId;
    const shopId = productShop._id || productShop;

    const itemPrice = variantName 
      ? (product.variants.find(v => v.name === variantName)?.price || product.price)
      : product.price;
    const itemStock = variantName 
      ? (product.variants.find(v => v.name === variantName)?.stock || 0) 
      : product.stock;

    if (shop && shop._id !== shopId) {
      // Conflict: Item from another shop
      return {
        success: false,
        conflict: true,
        conflictingShopName: shop.name,
        action: () => {
          const newItem = {
            productId: product._id,
            productName: product.name,
            variantName,
            quantity: Math.min(quantity, itemStock),
            price: itemPrice,
            stock: itemStock,
            imageUrl: product.imageUrl
          };
          saveCart([newItem], {
            _id: shopId,
            name: productShop.name || 'Store',
            address: productShop.address,
            deliverySettings: productShop.deliverySettings
          });
        }
      };
    }

    setCartItems(prevItems => {
      const currentItems = [...prevItems];
      const matchIdx = currentItems.findIndex(
        (item) => item.productId === product._id && item.variantName === variantName
      );

      if (matchIdx > -1) {
        currentItems[matchIdx] = {
          ...currentItems[matchIdx],
          quantity: Math.min(currentItems[matchIdx].quantity + quantity, itemStock)
        };
      } else {
        currentItems.push({
          productId: product._id,
          productName: product.name,
          variantName,
          quantity: Math.min(quantity, itemStock),
          price: itemPrice,
          stock: itemStock,
          imageUrl: product.imageUrl
        });
      }

      const activeShop = shop || {
        _id: shopId,
        name: productShop.name || 'Store',
        address: productShop.address,
        deliverySettings: productShop.deliverySettings
      };
      // Persist to localStorage
      if (currentItems.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: currentItems, shop: activeShop }));
      }
      setShop(activeShop);
      return currentItems;
    });

    return { success: true };
  }, [shop]);

  /**
   * updateQuantity - updates item counts
   */
  const updateQuantity = useCallback((productId, variantName, quantity) => {
    setCartItems(prevItems => {
      if (quantity <= 0) {
        const filtered = prevItems.filter(item => !(item.productId === productId && item.variantName === variantName));
        const activeShop = filtered.length === 0 ? null : shop;
        if (filtered.length === 0) {
          localStorage.removeItem(CART_STORAGE_KEY);
        } else {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: filtered, shop: activeShop }));
        }
        setShop(activeShop);
        return filtered;
      }

      const updated = prevItems.map(item => {
        if (item.productId === productId && item.variantName === variantName) {
          // Clamp quantity to available stock
          return { ...item, quantity: Math.min(quantity, item.stock) };
        }
        return item;
      });
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: updated, shop }));
      return updated;
    });
  }, [shop]);

  /**
   * removeFromCart - removes a specific item
   */
  const removeFromCart = useCallback((productId, variantName) => {
    const filtered = cartItems.filter(item => !(item.productId === productId && item.variantName === variantName));
    saveCart(filtered, filtered.length === 0 ? null : shop);
  }, [cartItems, shop]);

  /**
   * clearCart - wipes out cart
   */
  const clearCart = useCallback(() => {
    saveCart([], null);
  }, []);

  const totalAmount = cartItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      shop,
      totalAmount,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}

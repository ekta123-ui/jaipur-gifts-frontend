const CART_KEY = 'jaipur_cart_items';

export const getCartItems = () => {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
        return [];
    }
};

export const saveCartItems = (items) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: items }));
};

export const addToCart = (product, quantity = 1) => {
    const items = getCartItems();
    const giftId = product.giftId || product._id || product.id;
    const existing = items.find(item => item.giftId === giftId);

    const nextItems = existing
        ? items.map(item => item.giftId === giftId ? { ...item, quantity: item.quantity + quantity } : item)
        : [...items, {
            giftId,
            name: product.name,
            price: product.price,
            imgUrl: product.imgUrl || '/images/placeholder.jpg',
            quantity,
            customMessage: product.customMessage || '',
        }];

    saveCartItems(nextItems);
    return nextItems;
};

export const updateCartQuantity = (giftId, quantity) => {
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    const nextItems = getCartItems().map(item => item.giftId === giftId ? { ...item, quantity: safeQuantity } : item);
    saveCartItems(nextItems);
    return nextItems;
};

export const removeFromCart = (giftId) => {
    const nextItems = getCartItems().filter(item => item.giftId !== giftId);
    saveCartItems(nextItems);
    return nextItems;
};

export const clearCart = () => saveCartItems([]);

export const getCartCount = () => getCartItems().reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

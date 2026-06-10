export const CURRENCY_SYMBOL = "₹";

export const getPrice = (price) => {
  if (!price) return `${CURRENCY_SYMBOL}0`;

  if (typeof price === "object") {
    return price.display || `${CURRENCY_SYMBOL}${price.amount || 0}`;
  }

  return price;
};

export const getRating = (rating) => {
  if (!rating) return 0;

  if (typeof rating === "object") {
    return rating.average || 0;
  }

  return rating;
};
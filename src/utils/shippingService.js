// src/utils/shippingService.js

import ShippingRate from '../models/ShippingRate.js';

let cachedShippingRates = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// src/utils/shippingService.js
const fetchShippingRatesFromDB = async () => {
  try {
    const rates = await ShippingRate.find({}).lean();
    const ratesMap = {};
    rates.forEach(rate => {
      ratesMap[rate._id.toString()] = { governorate: rate.governorate, cost: rate.cost, time: rate.time };
    });
    cachedShippingRates = ratesMap;
    lastFetchTime = Date.now();
    return ratesMap;
  } catch (error) {
    console.error('Error fetching shipping rates from DB:', error);
    return {}; // Return empty object on error
  }
};

export const getShippingDetails = async (id) => {
  // Check if cache is valid
  if (cachedShippingRates && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
    const details = cachedShippingRates[id];
    if (details) {
      return details;
    }
  }

  // Fetch from DB if cache is invalid or ID not found in cache
  // We need to fetch all and rebuild cache if not found, or fetch by ID
  // For simplicity and to ensure cache is always up-to-date, we'll refetch all if cache is stale or ID not found
  const currentRates = await fetchShippingRatesFromDB();
  const details = currentRates[id];

  if (details) {
    return details;
  }
  // Default for areas not explicitly listed or 'خارج التغطية'
  return { cost: 150, time: '5-7 أيام عمل' };
};

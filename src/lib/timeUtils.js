/**
 * Time utility for Boston (Eastern Time) calculations.
 */

export const getBostonHour = () => {
  const options = {
    timeZone: 'America/New_York',
    hour: 'numeric',
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat([], options);
  return parseInt(formatter.format(new Date()), 10);
};

export const TIME_WINDOWS = {
  morning: { start: 7, end: 10, label: '7 AM - 10 AM', emoji: '🌅' },
  afternoon: { start: 10, end: 13, label: '10 AM - 1 PM', emoji: '🌞' },
  evening: { start: 13, end: 17, label: '1 PM - 5 PM', emoji: '🌇' },
};

export const ENFORCE_TIMING_RULES = false; // Set to false to allow completing sets anytime

export const getWindowStatus = (key) => {
  if (!ENFORCE_TIMING_RULES) return 'active';
  
  const currentHour = getBostonHour();
  const window = TIME_WINDOWS[key];
  
  if (!window) return 'inactive';
  
  if (currentHour >= window.start && currentHour < window.end) {
    return 'active';
  } else if (currentHour < window.start) {
    return 'upcoming';
  } else {
    return 'expired';
  }
};

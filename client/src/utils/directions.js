// getDirectionsUrl — builds a Google Maps search URL from a farm's location
// Returns null if there's no street address, since city/state/zip alone
// isn't precise enough to actually route someone to the farm

export const getDirectionsUrl = (location) => {
  if (!location?.street) return null;

  const address = [location.street, location.city, location.state, location.zip]
    .filter(Boolean)
    .join(', ');

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

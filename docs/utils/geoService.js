// NATIVA - Geolocation service: GPS tracking, geocoding, distance calculation

const GeoService = {
  GEO_CACHE_KEY: 'nativa_geo_cache',
  PROXIMITY_METERS: 500,

  watchPosition(onSuccess, onError) {
    if (!navigator.geolocation) {
      onError && onError({ message: 'GPS no disponible' });
      return null;
    }
    return navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true, timeout: 15000, maximumAge: 4000,
    });
  },

  clearWatch(id) {
    if (id != null) navigator.geolocation.clearWatch(id);
  },

  _getCache() {
    try { return JSON.parse(localStorage.getItem(this.GEO_CACHE_KEY)) || {}; } catch { return {}; }
  },
  _saveCache(c) {
    try { localStorage.setItem(this.GEO_CACHE_KEY, JSON.stringify(c)); } catch {}
  },

  async geocode(address) {
    if (!address) return null;
    const cache = this._getCache();
    if (cache[address]) return cache[address];

    const config = DataService.getConfigSync();
    const cityHint = (config.city || '').trim();
    const q = cityHint ? `${address}, ${cityHint}` : address;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { 'User-Agent': 'NATIVA-DistribucionAgua/1.0' } }
      );
      const data = await res.json();
      if (data && data[0]) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        cache[address] = coords;
        this._saveCache(cache);
        return coords;
      }
    } catch (e) { console.warn('Geocoding failed:', e); }
    return null;
  },

  // Haversine distance in meters
  distance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const r = x => x * Math.PI / 180;
    const dLat = r(lat2 - lat1), dLng = r(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  formatDistance(m) {
    if (m == null) return '';
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
  },

  isNearby(m) { return m != null && m <= this.PROXIMITY_METERS; },
};

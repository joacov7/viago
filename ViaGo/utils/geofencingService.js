const GeofencingService = {
  async createGeofence(zoneData) {
    try {
      console.log('Creando geofence:', zoneData);
      return {
        id: Date.now().toString(),
        ...zoneData,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Error al crear geofence: ' + error.message);
    }
  },

  async checkGeofenceEntry(driverLocation, zones) {
    try {
      const alerts = [];
      zones.forEach(zone => {
        const distance = this.calculateDistance(
          driverLocation.lat, driverLocation.lng,
          zone.lat, zone.lng
        );
        
        if (distance <= zone.radius) {
          alerts.push({
            zoneId: zone.id,
            zoneName: zone.name,
            event: 'entry',
            timestamp: new Date().toISOString()
          });
        }
      });
      
      return alerts;
    } catch (error) {
      throw new Error('Error al verificar geofence: ' + error.message);
    }
  },

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
};
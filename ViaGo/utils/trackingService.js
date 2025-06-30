const TrackingService = {
  async getShipmentLocation(shipmentId) {
    try {
      // Simulación de ubicación del conductor
      const locations = [
        { lat: 4.7110, lng: -74.0721, name: "Bogotá Centro", address: "Carrera 7 con Calle 26" },
        { lat: 4.6097, lng: -74.0817, name: "Zona Sur", address: "Av. Américas con Carrera 68" },
        { lat: 4.7587, lng: -74.0547, name: "Zona Norte", address: "Calle 127 con Autopista Norte" },
        { lat: 4.6486, lng: -74.0571, name: "Zona Occidental", address: "Av. El Dorado con Carrera 50" }
      ];
      
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      
      return {
        shipmentId,
        currentLocation: randomLocation,
        lastUpdate: new Date().toISOString(),
        estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      throw new Error('Error al obtener ubicación: ' + error.message);
    }
  },

  async getRouteInfo(pickupAddress, deliveryAddress) {
    try {
      // Simulación de información de ruta
      const distance = Math.floor(Math.random() * 50) + 5; // 5-55 km
      const duration = Math.floor(distance / 25 * 60); // minutos estimados
      
      return {
        distance: `${distance} km`,
        duration: `${duration} min`,
        route: [
          { lat: 4.7110, lng: -74.0721, name: "Punto de inicio" },
          { lat: 4.6486, lng: -74.0571, name: "Punto intermedio" },
          { lat: 4.6097, lng: -74.0817, name: "Destino final" }
        ]
      };
    } catch (error) {
      throw new Error('Error al calcular ruta: ' + error.message);
    }
  },

  async updateDriverLocation(driverId, location) {
    try {
      console.log(`Actualizando ubicación del conductor ${driverId}:`, location);
      
      return {
        success: true,
        driverId,
        location,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Error al actualizar ubicación: ' + error.message);
    }
  },

  generateTrackingCode(shipmentId) {
    const prefix = 'CE';
    const code = shipmentId.slice(-8).toUpperCase();
    return `${prefix}${code}`;
  },

  getDeliveryStatus(status) {
    const statusMap = {
      'Pendiente': {
        icon: 'clock',
        color: 'yellow',
        description: 'Esperando asignación de conductor'
      },
      'Asignado': {
        icon: 'user-check',
        color: 'blue',
        description: 'Conductor asignado, preparando recogida'
      },
      'En tránsito': {
        icon: 'truck',
        color: 'purple',
        description: 'En camino hacia el destino'
      },
      'Entregado': {
        icon: 'check-circle',
        color: 'green',
        description: 'Entrega completada exitosamente'
      },
      'Cancelado': {
        icon: 'x-circle',
        color: 'red',
        description: 'Envío cancelado'
      }
    };
    
    return statusMap[status] || statusMap['Pendiente'];
  }
};
const RouteService = {
  async optimizeRoute(shipments) {
    try {
      console.log(`Optimizando ruta para ${shipments.length} envíos`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const optimizedOrder = [...shipments].sort((a, b) => {
        return a.objectData.pickup_address.localeCompare(b.objectData.pickup_address);
      });

      return {
        originalOrder: shipments,
        optimizedOrder,
        totalDistance: this.calculateTotalDistance(optimizedOrder),
        estimatedTime: this.calculateEstimatedTime(optimizedOrder),
        fuelSaved: Math.round(Math.random() * 20 + 10),
        timeSaved: Math.round(Math.random() * 60 + 30)
      };
    } catch (error) {
      throw new Error('Error al optimizar ruta: ' + error.message);
    }
  },

  calculateTotalDistance(shipments) {
    const baseDistance = 5;
    const distancePerShipment = 8;
    return baseDistance + (shipments.length * distancePerShipment);
  },

  calculateEstimatedTime(shipments) {
    const baseTime = 30;
    const timePerShipment = 25;
    return baseTime + (shipments.length * timePerShipment);
  },

  async getTrafficInfo(route) {
    try {
      console.log('Obteniendo información de tráfico para la ruta');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        trafficLevel: ['light', 'moderate', 'heavy'][Math.floor(Math.random() * 3)],
        delays: Math.round(Math.random() * 30),
        alternativeRoutes: 2,
        estimatedDelay: Math.round(Math.random() * 15)
      };
    } catch (error) {
      throw new Error('Error al obtener información de tráfico: ' + error.message);
    }
  }
};
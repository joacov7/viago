const AnalyticsService = {
  generateReport(shipments, dateRange = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (dateRange * 24 * 60 * 60 * 1000));
    
    const filteredShipments = shipments.filter(shipment => {
      const shipmentDate = new Date(shipment.createdAt);
      return shipmentDate >= startDate && shipmentDate <= endDate;
    });

    return {
      totalShipments: filteredShipments.length,
      deliveredShipments: filteredShipments.filter(s => s.objectData.status === 'Entregado').length,
      pendingShipments: filteredShipments.filter(s => s.objectData.status === 'Pendiente').length,
      inTransitShipments: filteredShipments.filter(s => s.objectData.status === 'En tránsito').length,
      totalRevenue: this.calculateRevenue(filteredShipments),
      averageDeliveryTime: this.calculateAverageDeliveryTime(filteredShipments),
      topCargoTypes: this.getTopCargoTypes(filteredShipments)
    };
  },

  calculateRevenue(shipments) {
    return shipments
      .filter(s => s.objectData.status === 'Entregado')
      .reduce((total, shipment) => total + (shipment.objectData.price || 0), 0);
  },

  calculateAverageDeliveryTime(shipments) {
    const deliveredShipments = shipments.filter(s => s.objectData.status === 'Entregado');
    
    if (deliveredShipments.length === 0) return 0;

    const totalTime = deliveredShipments.reduce((total, shipment) => {
      const createdAt = new Date(shipment.createdAt);
      const updatedAt = new Date(shipment.updatedAt);
      return total + (updatedAt - createdAt);
    }, 0);

    return Math.round(totalTime / deliveredShipments.length / (1000 * 60 * 60)); // hours
  },

  getTopCargoTypes(shipments) {
    const cargoCount = {};
    
    shipments.forEach(shipment => {
      const cargoType = shipment.objectData.cargo_type;
      cargoCount[cargoType] = (cargoCount[cargoType] || 0) + 1;
    });

    return Object.entries(cargoCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  },

  getMonthlyTrends(shipments) {
    const monthlyData = {};
    
    shipments.forEach(shipment => {
      const date = new Date(shipment.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          shipments: 0,
          revenue: 0,
          delivered: 0
        };
      }
      
      monthlyData[monthKey].shipments++;
      if (shipment.objectData.status === 'Entregado') {
        monthlyData[monthKey].delivered++;
        monthlyData[monthKey].revenue += shipment.objectData.price || 0;
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }
};
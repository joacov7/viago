const ShipmentService = {
  async createShipment(shipmentData) {
    try {
      const result = await trickleCreateObject('shipment', shipmentData);
      return result;
    } catch (error) {
      throw new Error('Error al crear el envío: ' + error.message);
    }
  },

  async getShipments() {
    try {
      const result = await trickleListObjects('shipment', 50, true);
      return result.items || [];
    } catch (error) {
      throw new Error('Error al obtener envíos: ' + error.message);
    }
  },

  async updateShipment(shipmentId, updateData) {
    try {
      const result = await trickleUpdateObject('shipment', shipmentId, updateData);
      return result;
    } catch (error) {
      throw new Error('Error al actualizar el envío: ' + error.message);
    }
  },

  async deleteShipment(shipmentId) {
    try {
      await trickleDeleteObject('shipment', shipmentId);
      return true;
    } catch (error) {
      throw new Error('Error al eliminar el envío: ' + error.message);
    }
  },

  calculateEstimatedPrice(weight, cargoType) {
    const basePrice = 50;
    const weightPrice = parseFloat(weight) * 5;
    const typeMultiplier = {
      'Documentos': 1,
      'Paquetes': 1.2,
      'Electrodomésticos': 1.5,
      'Muebles': 2,
      'Materiales de construcción': 2.5,
      'Otros': 1.3
    };
    
    return Math.round((basePrice + weightPrice) * (typeMultiplier[cargoType] || 1.3));
  },

  getStatusOptions() {
    return ['Pendiente', 'Asignado', 'En tránsito', 'Entregado', 'Cancelado'];
  },

  getCargoTypes() {
    return [
      'Documentos',
      'Paquetes', 
      'Electrodomésticos',
      'Muebles',
      'Materiales de construcción',
      'Otros'
    ];
  }
};
const InventoryService = {
  async createInventoryItem(itemData) {
    try {
      const result = await trickleCreateObject('inventory', itemData);
      return result;
    } catch (error) {
      throw new Error('Error al crear item de inventario: ' + error.message);
    }
  },

  async getInventory() {
    try {
      const result = await trickleListObjects('inventory', 100, true);
      return result.items || [];
    } catch (error) {
      throw new Error('Error al obtener inventario: ' + error.message);
    }
  },

  async updateStock(itemId, newStock) {
    try {
      const result = await trickleUpdateObject('inventory', itemId, { stock: newStock });
      return result;
    } catch (error) {
      throw new Error('Error al actualizar stock: ' + error.message);
    }
  },

  async trackItemMovement(itemId, fromLocation, toLocation, quantity) {
    try {
      const movement = {
        item_id: itemId,
        from_location: fromLocation,
        to_location: toLocation,
        quantity,
        timestamp: new Date().toISOString(),
        type: 'transfer'
      };
      
      const result = await trickleCreateObject('inventory_movement', movement);
      return result;
    } catch (error) {
      throw new Error('Error al registrar movimiento: ' + error.message);
    }
  }
};
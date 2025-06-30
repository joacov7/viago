const ChatService = {
  async sendMessage(shipmentId, message, sender) {
    try {
      console.log(`Enviando mensaje para envío ${shipmentId}: ${message} - De: ${sender}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id: Date.now(),
        shipmentId,
        message,
        sender,
        timestamp: new Date().toISOString(),
        delivered: true
      };
    } catch (error) {
      throw new Error('Error al enviar mensaje: ' + error.message);
    }
  },

  async getMessages(shipmentId) {
    try {
      console.log(`Obteniendo mensajes para envío ${shipmentId}`);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [
        {
          id: 1,
          shipmentId,
          message: "Hola, ¿a qué hora llegará el conductor?",
          sender: "customer",
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: 2,
          shipmentId,
          message: "Llegaré en aproximadamente 30 minutos",
          sender: "driver",
          timestamp: new Date(Date.now() - 180000).toISOString()
        }
      ];
    } catch (error) {
      throw new Error('Error al obtener mensajes: ' + error.message);
    }
  },

  async markAsRead(shipmentId, messageId) {
    try {
      console.log(`Marcando mensaje ${messageId} como leído`);
      return { success: true };
    } catch (error) {
      throw new Error('Error al marcar como leído: ' + error.message);
    }
  }
};
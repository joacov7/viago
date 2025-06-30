const BillingService = {
  async generateInvoice(shipmentData) {
    try {
      const invoice = {
        id: `INV-${Date.now()}`,
        shipmentId: shipmentData.objectId,
        customerName: shipmentData.objectData.customer_name,
        customerEmail: shipmentData.objectData.customer_email || 'cliente@email.com',
        amount: shipmentData.objectData.price,
        tax: Math.round(shipmentData.objectData.price * 0.19),
        total: Math.round(shipmentData.objectData.price * 1.19),
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        items: [
          {
            description: `Transporte de ${shipmentData.objectData.cargo_type}`,
            quantity: 1,
            unitPrice: shipmentData.objectData.price,
            total: shipmentData.objectData.price
          }
        ]
      };

      console.log('Factura generada:', invoice);
      return invoice;
    } catch (error) {
      throw new Error('Error al generar factura: ' + error.message);
    }
  },

  async processPayment(invoiceId, paymentMethod, amount) {
    try {
      console.log(`Procesando pago de $${amount} para factura ${invoiceId} con ${paymentMethod}`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        transactionId: `TXN-${Date.now()}`,
        status: 'completed',
        amount,
        paymentMethod,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Error al procesar pago: ' + error.message);
    }
  },

  async sendInvoiceEmail(invoice) {
    try {
      console.log(`Enviando factura ${invoice.id} por email a ${invoice.customerEmail}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        emailSent: true,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Error al enviar factura por email: ' + error.message);
    }
  }
};
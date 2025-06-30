const NotificationService = {
  async sendSMS(phoneNumber, message) {
    try {
      console.log(`Simulando envío de SMS a ${phoneNumber}: ${message}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        messageId: 'sms_' + Date.now(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Error al enviar SMS: ' + error.message);
    }
  },

  async sendEmail(email, subject, message) {
    try {
      console.log(`Simulando envío de email a ${email}: ${subject} - ${message}`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        messageId: 'email_' + Date.now(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Error al enviar email: ' + error.message);
    }
  },

  async sendPushNotification(userId, title, message) {
    try {
      console.log(`Simulando push notification para ${userId}: ${title} - ${message}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        messageId: 'push_' + Date.now(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Error al enviar notificación push: ' + error.message);
    }
  },

  getNotificationTemplates() {
    return {
      shipmentCreated: {
        sms: "Tu envío #{shipmentId} ha sido creado. Te notificaremos cuando sea asignado a un conductor.",
        email: {
          subject: "Envío creado - CargoExpress",
          body: "Hola {customerName}, tu envío #{shipmentId} ha sido registrado exitosamente."
        }
      },
      shipmentAssigned: {
        sms: "Tu envío #{shipmentId} ha sido asignado al conductor {driverName}. Teléfono: {driverPhone}",
        email: {
          subject: "Conductor asignado - CargoExpress",
          body: "Tu envío #{shipmentId} ha sido asignado y pronto será recogido."
        }
      },
      shipmentInTransit: {
        sms: "Tu envío #{shipmentId} está en camino. Puedes seguir su ubicación en tiempo real.",
        email: {
          subject: "Envío en tránsito - CargoExpress",
          body: "Tu envío #{shipmentId} está en camino hacia su destino."
        }
      },
      shipmentDelivered: {
        sms: "¡Tu envío #{shipmentId} ha sido entregado exitosamente! Gracias por usar CargoExpress.",
        email: {
          subject: "Envío entregado - CargoExpress",
          body: "Tu envío #{shipmentId} ha sido entregado. ¡Gracias por confiar en nosotros!"
        }
      }
    };
  },

  formatMessage(template, variables) {
    let message = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      message = message.replace(regex, variables[key]);
    });
    return message;
  }
};
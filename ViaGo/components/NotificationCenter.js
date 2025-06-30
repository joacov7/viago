function NotificationCenter({ shipments }) {
  try {
    const [notifications, setNotifications] = React.useState([]);
    const [showNotifications, setShowNotifications] = React.useState(false);

    const generateNotifications = React.useCallback(() => {
      const newNotifications = [];
      
      shipments.forEach(shipment => {
        const timeDiff = Date.now() - new Date(shipment.updatedAt).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (shipment.objectData.status === 'Pendiente' && hoursDiff > 1) {
          newNotifications.push({
            id: `pending_${shipment.objectId}`,
            type: 'warning',
            title: 'Envío pendiente de asignación',
            message: `El envío ${shipment.objectId.slice(-8).toUpperCase()} lleva más de 1 hora sin asignar`,
            shipmentId: shipment.objectId
          });
        }
        
        if (shipment.objectData.status === 'En tránsito' && hoursDiff > 24) {
          newNotifications.push({
            id: `delay_${shipment.objectId}`,
            type: 'error',
            title: 'Posible retraso en entrega',
            message: `El envío ${shipment.objectId.slice(-8).toUpperCase()} está en tránsito hace más de 24 horas`,
            shipmentId: shipment.objectId
          });
        }
        
        if (shipment.objectData.status === 'Entregado' && hoursDiff < 1) {
          newNotifications.push({
            id: `delivered_${shipment.objectId}`,
            type: 'success',
            title: 'Entrega completada',
            message: `Envío ${shipment.objectId.slice(-8).toUpperCase()} entregado exitosamente`,
            shipmentId: shipment.objectId
          });
        }
      });
      
      setNotifications(newNotifications);
    }, [shipments]);

    React.useEffect(() => {
      generateNotifications();
    }, [generateNotifications]);

    const sendSMSNotification = async (phone, message) => {
      try {
        console.log(`SMS enviado a ${phone}: ${message}`);
        return true;
      } catch (error) {
        console.error('Error enviando SMS:', error);
        return false;
      }
    };

    const sendEmailNotification = async (email, subject, message) => {
      try {
        console.log(`Email enviado a ${email}: ${subject} - ${message}`);
        return true;
      } catch (error) {
        console.error('Error enviando email:', error);
        return false;
      }
    };

    const getNotificationIcon = (type) => {
      const icons = {
        success: 'check-circle',
        warning: 'alert-triangle',
        error: 'alert-circle',
        info: 'info'
      };
      return icons[type] || 'bell';
    };

    const getNotificationColor = (type) => {
      const colors = {
        success: 'text-green-600 bg-green-100',
        warning: 'text-yellow-600 bg-yellow-100',
        error: 'text-red-600 bg-red-100',
        info: 'text-blue-600 bg-blue-100'
      };
      return colors[type] || 'text-gray-600 bg-gray-100';
    };

    return (
      <div className="relative" data-name="notification-center" data-file="components/NotificationCenter.js">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <div className="icon-bell text-xl"></div>
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No hay notificaciones
                </div>
              ) : (
                notifications.map(notification => (
                  <div key={notification.id} className="p-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getNotificationColor(notification.type)}`}>
                        <div className={`icon-${getNotificationIcon(notification.type)} text-lg`}></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => sendSMSNotification('+1234567890', notification.message)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Enviar SMS
                          </button>
                          <button
                            onClick={() => sendEmailNotification('cliente@email.com', notification.title, notification.message)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Enviar Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('NotificationCenter component error:', error);
    return null;
  }
}
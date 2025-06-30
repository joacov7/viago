function ChatSystem({ shipmentId, customerName, driverName }) {
  try {
    const [messages, setMessages] = React.useState([]);
    const [newMessage, setNewMessage] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);
    const [userType, setUserType] = React.useState('customer');

    const addMessage = async (text, sender) => {
      const message = {
        id: Date.now(),
        text,
        sender,
        timestamp: new Date().toISOString(),
        shipmentId
      };
      setMessages(prev => [...prev, message]);
    };

    const handleSendMessage = async () => {
      if (!newMessage.trim()) return;
      
      await addMessage(newMessage, userType);
      setNewMessage('');
      
      setTimeout(() => {
        const response = userType === 'customer' 
          ? "Conductor: Recibido, estoy en camino."
          : "Cliente: Perfecto, gracias por la actualización.";
        addMessage(response, userType === 'customer' ? 'driver' : 'customer');
      }, 2000);
    };

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div data-name="chat-system" data-file="components/ChatSystem.js">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <div className="icon-message-circle text-lg mr-1"></div>
          Chat
        </button>

        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-md h-96 flex flex-col">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">
                  Chat - Envío {shipmentId?.slice(-8).toUpperCase()}
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400">
                  <div className="icon-x text-lg"></div>
                </button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center">No hay mensajes</p>
                ) : (
                  messages.map(message => (
                    <div key={message.id} className={`flex ${
                      message.sender === userType ? 'justify-end' : 'justify-start'
                    }`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.sender === userType
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === userType ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <div className="flex mb-2">
                  <button
                    onClick={() => setUserType('customer')}
                    className={`px-3 py-1 text-xs rounded mr-2 ${
                      userType === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    Cliente
                  </button>
                  <button
                    onClick={() => setUserType('driver')}
                    className={`px-3 py-1 text-xs rounded ${
                      userType === 'driver' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    Conductor
                  </button>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg"
                  >
                    <div className="icon-send text-lg"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('ChatSystem component error:', error);
    return null;
  }
}
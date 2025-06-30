function BillingPanel({ shipments }) {
  try {
    const [invoices, setInvoices] = React.useState([]);
    const [showInvoiceModal, setShowInvoiceModal] = React.useState(false);
    const [selectedShipment, setSelectedShipment] = React.useState(null);

    const deliveredShipments = shipments.filter(s => s.objectData.status === 'Entregado');

    const generateInvoice = (shipment) => {
      const invoice = {
        id: `INV-${Date.now()}`,
        shipmentId: shipment.objectId,
        customerName: shipment.objectData.customer_name,
        amount: shipment.objectData.price,
        createdAt: new Date().toISOString(),
        status: 'Pagada',
        items: [
          {
            description: `Transporte de ${shipment.objectData.cargo_type}`,
            quantity: 1,
            unitPrice: shipment.objectData.price,
            total: shipment.objectData.price
          }
        ]
      };
      
      setInvoices(prev => [...prev, invoice]);
      setShowInvoiceModal(false);
      alert('Factura generada exitosamente');
    };

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    return (
      <div className="max-w-6xl mx-auto" data-name="billing-panel" data-file="components/BillingPanel.js">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Facturación</h2>
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="btn-primary flex items-center"
          >
            <div className="icon-file-plus text-lg mr-2"></div>
            Nueva Factura
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center">
              <div className="icon-dollar-sign text-2xl text-green-600 mr-3"></div>
              <div>
                <p className="text-sm text-green-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-900">${totalRevenue}</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <div className="icon-file-text text-2xl text-blue-600 mr-3"></div>
              <div>
                <p className="text-sm text-blue-600">Facturas Emitidas</p>
                <p className="text-2xl font-bold text-blue-900">{invoices.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-purple-50 border-purple-200">
            <div className="flex items-center">
              <div className="icon-credit-card text-2xl text-purple-600 mr-3"></div>
              <div>
                <p className="text-sm text-purple-600">Promedio por Factura</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${invoices.length ? Math.round(totalRevenue / invoices.length) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Facturas Recientes</h3>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay facturas generadas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cliente</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Monto</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice.id} className="border-t">
                      <td className="px-4 py-2 text-sm">{invoice.id}</td>
                      <td className="px-4 py-2 text-sm">{invoice.customerName}</td>
                      <td className="px-4 py-2 text-sm font-medium">${invoice.amount}</td>
                      <td className="px-4 py-2">
                        <span className="status-badge status-delivered">Pagada</span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(invoice.createdAt).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generar Factura</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Envío Entregado
                </label>
                <select
                  value={selectedShipment?.objectId || ''}
                  onChange={(e) => {
                    const shipment = deliveredShipments.find(s => s.objectId === e.target.value);
                    setSelectedShipment(shipment);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar envío...</option>
                  {deliveredShipments.map(shipment => (
                    <option key={shipment.objectId} value={shipment.objectId}>
                      {shipment.objectData.customer_name} - ${shipment.objectData.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => selectedShipment && generateInvoice(selectedShipment)}
                  disabled={!selectedShipment}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  Generar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('BillingPanel component error:', error);
    return null;
  }
}
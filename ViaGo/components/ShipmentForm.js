function ShipmentForm({ onSubmit, onPriceCalculated }) {
  try {
    const [formData, setFormData] = React.useState({
      pickup_address: '',
      delivery_address: '',
      cargo_type: 'Paquetes',
      weight: '',
      dimensions: '',
      pickup_date: '',
      customer_name: '',
      customer_phone: ''
    });
    const [estimatedPrice, setEstimatedPrice] = React.useState(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculatePrice = () => {
      if (formData.weight && formData.cargo_type) {
        const basePrice = 50;
        const weightPrice = parseFloat(formData.weight) * 5;
        const typeMultiplier = {
          'Documentos': 1,
          'Paquetes': 1.2,
          'Electrodomésticos': 1.5,
          'Muebles': 2,
          'Materiales de construcción': 2.5,
          'Otros': 1.3
        };
        const price = Math.round((basePrice + weightPrice) * typeMultiplier[formData.cargo_type]);
        setEstimatedPrice(price);
        onPriceCalculated && onPriceCalculated(price);
      }
    };

    React.useEffect(() => {
      calculatePrice();
    }, [formData.weight, formData.cargo_type]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        const shipmentData = {
          ...formData,
          weight: parseFloat(formData.weight),
          price: estimatedPrice,
          status: 'Pendiente'
        };
        
        await onSubmit(shipmentData);
        setFormData({
          pickup_address: '',
          delivery_address: '',
          cargo_type: 'Paquetes',
          weight: '',
          dimensions: '',
          pickup_date: '',
          customer_name: '',
          customer_phone: ''
        });
        setEstimatedPrice(null);
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto" data-name="shipment-form" data-file="components/ShipmentForm.js">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Solicitar Nuevo Envío</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección de Recogida
                </label>
                <input
                  type="text"
                  name="pickup_address"
                  value={formData.pickup_address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Calle 123, Ciudad"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección de Entrega
                </label>
                <input
                  type="text"
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Avenida 456, Ciudad"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Carga
                </label>
                <select
                  name="cargo_type"
                  value={formData.cargo_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Documentos">Documentos</option>
                  <option value="Paquetes">Paquetes</option>
                  <option value="Electrodomésticos">Electrodomésticos</option>
                  <option value="Muebles">Muebles</option>
                  <option value="Materiales de construcción">Materiales de construcción</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  required
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensiones
                </label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="L x A x H cm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Recogida
                </label>
                <input
                  type="datetime-local"
                  name="pickup_date"
                  value={formData.pickup_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            {estimatedPrice && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="icon-calculator text-xl text-blue-600 mr-3"></div>
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">Precio Estimado</h3>
                    <p className="text-2xl font-bold text-blue-600">${estimatedPrice}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Procesando...' : 'Solicitar Envío'}
            </button>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ShipmentForm component error:', error);
    return null;
  }
}
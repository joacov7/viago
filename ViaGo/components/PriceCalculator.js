function PriceCalculator({ weight, cargoType, onPriceUpdate }) {
  try {
    const [calculatedPrice, setCalculatedPrice] = React.useState(0);

    const calculatePrice = React.useCallback(() => {
      if (!weight || !cargoType) {
        setCalculatedPrice(0);
        onPriceUpdate && onPriceUpdate(0);
        return;
      }

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
      
      const price = Math.round((basePrice + weightPrice) * (typeMultiplier[cargoType] || 1.3));
      setCalculatedPrice(price);
      onPriceUpdate && onPriceUpdate(price);
    }, [weight, cargoType, onPriceUpdate]);

    React.useEffect(() => {
      calculatePrice();
    }, [calculatePrice]);

    const getPriceBreakdown = () => {
      if (!weight || !cargoType) return null;
      
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
      
      return {
        base: basePrice,
        weight: weightPrice,
        multiplier: typeMultiplier[cargoType] || 1.3,
        total: calculatedPrice
      };
    };

    const breakdown = getPriceBreakdown();

    if (!breakdown) return null;

    return (
      <div className="card bg-blue-50 border-blue-200" data-name="price-calculator" data-file="components/PriceCalculator.js">
        <div className="flex items-center mb-4">
          <div className="icon-calculator text-xl text-blue-600 mr-3"></div>
          <h3 className="text-lg font-medium text-blue-900">Cálculo de Precio</h3>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Precio base:</span>
            <span className="font-medium">${breakdown.base}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Por peso ({weight} kg):</span>
            <span className="font-medium">${breakdown.weight}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tipo de carga (x{breakdown.multiplier}):</span>
            <span className="font-medium">{cargoType}</span>
          </div>
          <div className="border-t border-blue-300 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-900">Total estimado:</span>
              <span className="text-2xl font-bold text-blue-600">${breakdown.total}</span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('PriceCalculator component error:', error);
    return null;
  }
}
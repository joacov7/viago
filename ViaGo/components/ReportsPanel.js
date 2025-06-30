function ReportsPanel({ shipments }) {
  try {
    const [dateRange, setDateRange] = React.useState('30');

    const getAnalytics = () => {
      const total = shipments.length;
      const delivered = shipments.filter(s => s.objectData.status === 'Entregado').length;
      const pending = shipments.filter(s => s.objectData.status === 'Pendiente').length;
      const inTransit = shipments.filter(s => s.objectData.status === 'En tránsito').length;
      
      const totalRevenue = shipments
        .filter(s => s.objectData.status === 'Entregado')
        .reduce((sum, s) => sum + (s.objectData.price || 0), 0);
      
      const avgPrice = total > 0 ? totalRevenue / delivered : 0;
      
      return {
        total,
        delivered,
        pending,
        inTransit,
        totalRevenue,
        avgPrice,
        deliveryRate: total > 0 ? (delivered / total * 100).toFixed(1) : 0
      };
    };

    const analytics = getAnalytics();

    const getCargoTypeStats = () => {
      const stats = {};
      shipments.forEach(shipment => {
        const type = shipment.objectData.cargo_type;
        if (!stats[type]) {
          stats[type] = { count: 0, revenue: 0 };
        }
        stats[type].count++;
        if (shipment.objectData.status === 'Entregado') {
          stats[type].revenue += shipment.objectData.price || 0;
        }
      });
      return Object.entries(stats).map(([type, data]) => ({
        type,
        ...data
      }));
    };

    const cargoStats = getCargoTypeStats();

    return (
      <div className="max-w-6xl mx-auto" data-name="reports-panel" data-file="components/ReportsPanel.js">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reportes y Analytics</h2>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <div className="icon-package text-2xl text-blue-600 mr-3"></div>
              <div>
                <p className="text-sm text-blue-600">Total Envíos</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.total}</p>
              </div>
            </div>
          </div>

          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center">
              <div className="icon-check-circle text-2xl text-green-600 mr-3"></div>
              <div>
                <p className="text-sm text-green-600">Entregados</p>
                <p className="text-2xl font-bold text-green-900">{analytics.delivered}</p>
              </div>
            </div>
          </div>

          <div className="card bg-purple-50 border-purple-200">
            <div className="flex items-center">
              <div className="icon-dollar-sign text-2xl text-purple-600 mr-3"></div>
              <div>
                <p className="text-sm text-purple-600">Ingresos</p>
                <p className="text-2xl font-bold text-purple-900">${analytics.totalRevenue}</p>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <div className="icon-trending-up text-2xl text-yellow-600 mr-3"></div>
              <div>
                <p className="text-sm text-yellow-600">Tasa Entrega</p>
                <p className="text-2xl font-bold text-yellow-900">{analytics.deliveryRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Envíos</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Entregados</span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{width: `${(analytics.delivered / analytics.total) * 100}%`}}
                    ></div>
                  </div>
                  <span className="font-medium">{analytics.delivered}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">En tránsito</span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{width: `${(analytics.inTransit / analytics.total) * 100}%`}}
                    ></div>
                  </div>
                  <span className="font-medium">{analytics.inTransit}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pendientes</span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{width: `${(analytics.pending / analytics.total) * 100}%`}}
                    ></div>
                  </div>
                  <span className="font-medium">{analytics.pending}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Carga</h3>
            <div className="space-y-3">
              {cargoStats.map((stat, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600">{stat.type}</span>
                  <div className="text-right">
                    <p className="font-medium">{stat.count} envíos</p>
                    <p className="text-sm text-gray-500">${stat.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ReportsPanel component error:', error);
    return null;
  }
}
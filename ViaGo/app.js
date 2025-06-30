class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-black"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  try {
    const [activeTab, setActiveTab] = React.useState('new');
    const [shipments, setShipments] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    const loadShipments = async () => {
      setLoading(true);
      try {
        const shipmentsData = await ShipmentService.getShipments();
        setShipments(shipmentsData);
      } catch (error) {
        alert('Error al cargar envíos: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    const handleCreateShipment = async (shipmentData) => {
      try {
        await ShipmentService.createShipment(shipmentData);
        alert('Envío creado exitosamente');
        setActiveTab('shipments');
        loadShipments();
      } catch (error) {
        alert('Error al crear envío: ' + error.message);
      }
    };

    const handleUpdateShipment = async (shipmentId, updateData) => {
      try {
        await ShipmentService.updateShipment(shipmentId, updateData);
        loadShipments();
      } catch (error) {
        throw error;
      }
    };

    React.useEffect(() => {
      if (activeTab === 'shipments' || activeTab === 'tracking' || activeTab === 'driver') {
        loadShipments();
      }
    }, [activeTab]);

    return (
      <div className="min-h-screen bg-gray-50" data-name="app" data-file="app.js">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-2 bg-white border-b">
          <Header activeTab={activeTab} setActiveTab={setActiveTab} />
          <NotificationCenter shipments={shipments} />
        </div>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'new' && (
            <ShipmentForm onSubmit={handleCreateShipment} />
          )}
          
          {activeTab === 'shipments' && (
            <ShipmentList 
              shipments={shipments}
              loading={loading}
              onRefresh={loadShipments}
            />
          )}
          
          {activeTab === 'tracking' && (
            <TrackingMap shipments={shipments} />
          )}
          
          {activeTab === 'driver' && (
            <DriverPanel 
              shipments={shipments}
              onUpdateShipment={handleUpdateShipment}
            />
          )}
          
          {activeTab === 'reports' && (
            <ReportsPanel shipments={shipments} />
          )}
          
          {activeTab === 'fleet' && (
            <FleetManagement />
          )}
          
          {activeTab === 'billing' && (
            <BillingPanel shipments={shipments} />
          )}
        </main>
      </div>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
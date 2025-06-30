function RatingSystem({ shipment, onRatingSubmit }) {
  try {
    const [rating, setRating] = React.useState(0);
    const [comment, setComment] = React.useState('');
    const [showModal, setShowModal] = React.useState(false);

    const handleSubmit = async () => {
      try {
        await onRatingSubmit(shipment.objectId, { rating, comment });
        setShowModal(false);
        setRating(0);
        setComment('');
        alert('Calificación enviada exitosamente');
      } catch (error) {
        alert('Error al enviar calificación: ' + error.message);
      }
    };

    const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
      return (
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onRatingChange(star)}
              className={`text-2xl ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              } ${!readOnly ? 'hover:text-yellow-400' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
      );
    };

    return (
      <div data-name="rating-system" data-file="components/RatingSystem.js">
        <button
          onClick={() => setShowModal(true)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Calificar servicio
        </button>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Calificar Servicio
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Envío: {shipment.objectData.cargo_type}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  ID: {shipment.objectId.slice(-8).toUpperCase()}
                </p>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calificación
                </label>
                <StarRating rating={rating} onRatingChange={setRating} />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios (opcional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Comparte tu experiencia..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  Enviar Calificación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('RatingSystem component error:', error);
    return null;
  }
}
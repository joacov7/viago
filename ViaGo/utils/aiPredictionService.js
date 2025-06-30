const AIPredictionService = {
  async predictDemand(historicalData, period = 'week') {
    try {
      const systemPrompt = `Eres un experto analista de datos logísticos. Analiza los patrones históricos de envíos y genera predicciones precisas de demanda.

Datos históricos: ${JSON.stringify(historicalData)}

Genera predicciones para: ${period}

Responde en JSON con:
- demandaPrediction: número estimado
- confidence: porcentaje de confianza
- factors: factores que influyen
- recommendations: recomendaciones`;

      const userPrompt = `Analiza la demanda y genera predicción para ${period}`;

      const result = await invokeAIAgent(systemPrompt, userPrompt);
      return JSON.parse(result.replace(/```json/g, '').replace(/```/g, ''));
    } catch (error) {
      throw new Error('Error en predicción IA: ' + error.message);
    }
  },

  async optimizePricing(marketData, demandLevel) {
    try {
      const systemPrompt = `Eres un especialista en precios dinámicos para logística. Optimiza precios basado en demanda y competencia.

Datos de mercado: ${JSON.stringify(marketData)}
Nivel de demanda: ${demandLevel}

Responde en JSON con:
- basePrice: precio base recomendado
- dynamicMultiplier: multiplicador por demanda
- competitorAnalysis: análisis de competencia`;

      const result = await invokeAIAgent(systemPrompt, 'Optimiza precios');
      return JSON.parse(result.replace(/```json/g, '').replace(/```/g, ''));
    } catch (error) {
      throw new Error('Error en optimización de precios: ' + error.message);
    }
  }
};
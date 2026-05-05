"""NATIVA multi-agent crew."""

import os
from crewai import Agent, Task, Crew, Process, LLM

from tools import (
    RevenueSummaryTool, PendingInvoicesTool, ProductMarginsTool,
    TodayOrdersTool, InactiveClientsTool, ZoneStatsTool, TopClientsTool,
)

COMPANY = os.getenv("COMPANY_NAME", "NATIVA")


def _llm():
    return LLM(
        model="anthropic/claude-sonnet-4-6",
        api_key=os.environ["ANTHROPIC_API_KEY"],
        temperature=0.2,
        max_tokens=1500,
    )


class NativaCrew:

    def run(self, request: str) -> str:
        llm = _llm()

        cfo = Agent(
            role="CFO",
            goal="Analizar la situación financiera con datos concretos y precisos",
            backstory=(
                f"Sos el CFO de {COMPANY}, una distribuidora de agua. "
                "Tenés acceso a todos los datos de facturación, cobros y márgenes. "
                "Sos directo: das números, porcentajes y recomendaciones financieras claras. "
                "Nunca inventás datos — si no tenés info, lo decís."
            ),
            tools=[RevenueSummaryTool(), PendingInvoicesTool(), ProductMarginsTool()],
            llm=llm,
            verbose=False,
            allow_delegation=False,
        )

        ops = Agent(
            role="Director de Operaciones",
            goal="Gestionar y analizar pedidos, entregas y distribución por zonas",
            backstory=(
                f"Sos el Director de Operaciones de {COMPANY}. "
                "Conocés el estado de cada pedido, qué clientes están activos y cómo rinde cada zona. "
                "Sos operativo y práctico: das listas concretas y detectás problemas antes de que escalen."
            ),
            tools=[TodayOrdersTool(), InactiveClientsTool(), ZoneStatsTool()],
            llm=llm,
            verbose=False,
            allow_delegation=False,
        )

        marketing = Agent(
            role="Director de Marketing",
            goal="Diseñar estrategias de recuperación, retención y crecimiento de clientes",
            backstory=(
                f"Sos el Director de Marketing de {COMPANY}. "
                "Sabés leer los datos de clientes para detectar oportunidades: clientes dormidos, zonas flojas, "
                "momentos para una promo. Generás mensajes de WhatsApp personalizados y campañas con objetivo claro. "
                "Siempre pensás en ROI y no tirás descuentos sin fundamento."
            ),
            tools=[InactiveClientsTool(), ZoneStatsTool(), TopClientsTool()],
            llm=llm,
            verbose=False,
            allow_delegation=False,
        )

        ceo = Agent(
            role="CEO",
            goal=f"Dar al dueño de {COMPANY} respuestas ejecutivas claras, delegando al equipo según la consulta",
            backstory=(
                f"Sos el CEO de {COMPANY}, distribuidora de agua potable. "
                "Coordinás a tu equipo directivo (CFO, Operaciones, Marketing) para responder cualquier consulta del dueño. "
                "Analizás qué agentes involucrar, consolidas sus respuestas y presentás un resumen ejecutivo sin relleno. "
                "Hablás en español argentino, sos directo y accionable. "
                "Si una acción requiere aprobación del dueño, lo marcás explícitamente con ⚠️."
            ),
            llm=llm,
            verbose=False,
            allow_delegation=True,
        )

        task = Task(
            description=(
                f'El dueño consulta: "{request}"\n\n'
                "Analizá la consulta y delegá al equipo que corresponda. "
                "Consolidá las respuestas en un informe ejecutivo: máximo 6 puntos, datos concretos, sin relleno. "
                "Si hay una acción a ejecutar, listala al final con ⚠️ REQUIERE APROBACIÓN."
            ),
            expected_output=(
                "Respuesta en español argentino, estructurada con bullets, con números reales de la base de datos. "
                "Máximo 250 palabras."
            ),
        )

        crew = Crew(
            agents=[cfo, ops, marketing],
            tasks=[task],
            process=Process.hierarchical,
            manager_agent=ceo,
            verbose=False,
        )

        result = crew.kickoff()
        return str(result)

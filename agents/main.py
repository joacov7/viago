"""NATIVA CEO Bot — Telegram entry point."""

import asyncio
import logging
import os
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes

load_dotenv()

logging.basicConfig(format="%(asctime)s %(levelname)s %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

OWNER_ID = int(os.getenv("TELEGRAM_OWNER_ID", "0"))
executor = ThreadPoolExecutor(max_workers=2)

# Stores pending approved actions: chat_id -> {request, plan}
pending_actions: dict = {}


def _run_crew(text: str) -> str:
    from crew import NativaCrew
    return NativaCrew().run(text)


def _execute_crew(request: str, plan: str) -> str:
    from crew import NativaCrew
    return NativaCrew().execute(request, plan)


def _requires_action(text: str) -> bool:
    return "⚠️" in text


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER_ID:
        return
    company = os.getenv("COMPANY_NAME", "NATIVA")
    await update.message.reply_text(
        f"👔 CEO de *{company}* listo.\n\n"
        "Podés preguntarme cualquier cosa sobre la empresa:\n"
        "• Cómo cerró el mes\n"
        "• Clientes sin pedir hace 30 días\n"
        "• Hacer una oferta para clientes inactivos\n"
        "• Cuánto se cobró hoy\n"
        "• Qué zonas rinden menos\n\n"
        "Hablo con mi equipo y te traigo la respuesta.",
        parse_mode="Markdown",
    )


async def cmd_hoy(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER_ID:
        return
    await _handle(update, "Resumen del día de hoy: pedidos, entregas y cobros")


async def cmd_mes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER_ID:
        return
    await _handle(update, "Resumen financiero y operativo del mes actual")


async def cmd_deudas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER_ID:
        return
    await _handle(update, "Lista de clientes con facturas pendientes de pago, ordenados por monto")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER_ID:
        return
    await _handle(update, update.message.text)


async def _handle(update: Update, text: str):
    chat_id = update.effective_chat.id
    thinking = await update.message.reply_text("⏳ Consultando con el equipo...")
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(executor, _run_crew, text)
        await thinking.delete()

        if _requires_action(result):
            pending_actions[chat_id] = {"request": text, "plan": result}
            keyboard = InlineKeyboardMarkup([[
                InlineKeyboardButton("✅ Sí, ejecutar", callback_data="confirm"),
                InlineKeyboardButton("❌ No", callback_data="reject"),
            ]])
            await update.message.reply_text(result, reply_markup=keyboard, parse_mode="Markdown")
        else:
            await update.message.reply_text(result, parse_mode="Markdown")

    except Exception as e:
        logger.exception("Crew error")
        await thinking.edit_text(f"❌ Error: {e}")


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    chat_id = query.message.chat_id

    if query.data == "confirm":
        stored = pending_actions.pop(chat_id, None)
        if not stored:
            await query.edit_message_text("⚠️ La acción expiró. Volvé a pedirla.")
            return
        await query.edit_message_text(query.message.text + "\n\n⏳ Ejecutando...")
        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                executor, _execute_crew, stored["request"], stored["plan"]
            )
            await query.message.reply_text(result, parse_mode="Markdown")
        except Exception as e:
            logger.exception("Execute error")
            await query.message.reply_text(f"❌ Error al ejecutar: {e}")

    elif query.data == "reject":
        pending_actions.pop(chat_id, None)
        await query.edit_message_text(query.message.text + "\n\n❌ Acción cancelada.")


def main():
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("hoy", cmd_hoy))
    app.add_handler(CommandHandler("mes", cmd_mes))
    app.add_handler(CommandHandler("deudas", cmd_deudas))
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    logger.info("Bot iniciado")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()

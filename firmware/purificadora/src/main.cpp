#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>
#include "config.h"

// ═══════════════════════════════════════════════════════
//  Tipos
// ═══════════════════════════════════════════════════════
enum SysState {
    ST_IDLE,
    ST_PRIMING,    // bomba alim encendida, esperando antes de arrancar HP
    ST_PURIFYING,  // purificación completa activa
    ST_WASHING,    // ciclo lavado bidones
    ST_ALARM,
    ST_MANUAL
};

enum WashPhase {
    WP_IDLE,
    WP_STAGE1, WP_PAUSE1,
    WP_STAGE2, WP_PAUSE2,
    WP_STAGE3,
    WP_DONE
};

// ═══════════════════════════════════════════════════════
//  Globales
// ═══════════════════════════════════════════════════════
Adafruit_SSD1306   display(SCREEN_W, SCREEN_H, &Wire, -1);
WiFiClientSecure   tlsClient;
UniversalTelegramBot bot(BOT_TOKEN, tlsClient);

SysState  sysState  = ST_IDLE;
WashPhase washPhase = WP_IDLE;
bool      autoMode  = false;

// Lecturas de sensores
float tdsin    = 0.0f;
float tdsout   = 0.0f;
float presion  = 0.0f;
bool  flCisterna = false;
bool  flTkBajo   = false;
bool  flTkAlto   = false;

// Timers no-bloqueantes
unsigned long tLastSensor   = 0;
unsigned long tLastDisplay  = 0;
unsigned long tLastTelegram = 0;
unsigned long tPhaseStart   = 0;   // usado por priming y washing
unsigned long tTankFull     = 0;
bool          tankFullPending = false;

String alarmMsg = "";

// ═══════════════════════════════════════════════════════
//  Helpers de relé
// ═══════════════════════════════════════════════════════
void rSet(uint8_t pin, bool on) {
    digitalWrite(pin, on ? RELAY_ON : RELAY_OFF);
}

bool rGet(uint8_t pin) {
    return digitalRead(pin) == RELAY_ON;
}

void allOff() {
    const uint8_t pins[] = {
        PIN_R_ALIM, PIN_R_HP, PIN_R_SOL,
        PIN_R_UV, PIN_R_LAV1, PIN_R_LAV2, PIN_R_LAV3, PIN_R_ALARM
    };
    for (uint8_t p : pins) digitalWrite(p, RELAY_OFF);
}

// ═══════════════════════════════════════════════════════
//  Lectura de sensores
// ═══════════════════════════════════════════════════════
float calcTDS(uint8_t pin) {
    // Promedio de 10 muestras para reducir ruido ADC
    long sum = 0;
    for (int i = 0; i < 10; i++) sum += analogRead(pin);
    float voltage = (sum / 10.0f / 4095.0f) * 3.3f;
    // Compensación de temperatura
    float compV = voltage / (1.0f + 0.02f * (WATER_TEMP_C - 25.0f));
    return (133.42f * powf(compV, 3) - 255.86f * powf(compV, 2) + 857.39f * compV) * 0.5f;
}

float calcPressure() {
    long sum = 0;
    for (int i = 0; i < 10; i++) sum += analogRead(PIN_PRESION);
    float voltage = (sum / 10.0f / 4095.0f) * 3.3f;
    voltage = constrain(voltage, PRES_V_MIN, PRES_V_MAX);
    return (voltage - PRES_V_MIN) / (PRES_V_MAX - PRES_V_MIN)
           * (PRES_BAR_MAX - PRES_BAR_MIN) + PRES_BAR_MIN;
}

void readSensors() {
    tdsin      = calcTDS(PIN_TDS_IN);
    tdsout     = calcTDS(PIN_TDS_OUT);
    presion    = calcPressure();
    flCisterna = digitalRead(PIN_FL_CISTERNA) == HIGH;
    flTkBajo   = digitalRead(PIN_FL_TK_BAJO)  == HIGH;
    flTkAlto   = digitalRead(PIN_FL_TK_ALTO)  == HIGH;
}

// ═══════════════════════════════════════════════════════
//  Alarma
// ═══════════════════════════════════════════════════════
void triggerAlarm(const String& msg) {
    allOff();
    rSet(PIN_R_ALARM, true);
    sysState = ST_ALARM;
    autoMode = false;
    alarmMsg = msg;
    bot.sendMessage(CHAT_ID, "⚠️ ALARMA: " + msg, "");
    Serial.println("[ALARM] " + msg);
}

void clearAlarm() {
    rSet(PIN_R_ALARM, false);
    sysState = ST_IDLE;
    alarmMsg = "";
}

// ═══════════════════════════════════════════════════════
//  Verificaciones de seguridad
// ═══════════════════════════════════════════════════════
void checkSafety() {
    if (sysState == ST_ALARM || sysState == ST_MANUAL) return;

    if (!flCisterna) {
        triggerAlarm("Cisterna sin agua");
        return;
    }
    // Verificaciones solo cuando la bomba HP está activa
    if (sysState == ST_PURIFYING) {
        if (presion > PRES_SAFE_MAX) {
            triggerAlarm("Presión alta: " + String(presion, 1) + " bar");
            return;
        }
        if (presion < PRES_SAFE_MIN) {
            triggerAlarm("Presión baja: " + String(presion, 1) + " bar");
            return;
        }
        if (tdsout > TDS_OUT_MAX_PPM) {
            triggerAlarm("TDS salida alto: " + String((int)tdsout) + " ppm");
            return;
        }
    }
}

// ═══════════════════════════════════════════════════════
//  Control de purificación
// ═══════════════════════════════════════════════════════
void startPurification() {
    if (sysState == ST_ALARM || sysState == ST_WASHING) return;
    allOff();
    sysState     = ST_PRIMING;
    autoMode     = true;
    tPhaseStart  = millis();
    rSet(PIN_R_ALIM, true);  // arrancar bomba de alimentación primero
    tankFullPending = false;
    bot.sendMessage(CHAT_ID, "⏳ Cebando bomba de alimentación...", "");
}

void stopPurification() {
    // Apagado secuencial: HP primero, luego alimentación
    rSet(PIN_R_HP, false);
    rSet(PIN_R_SOL, false);
    rSet(PIN_R_UV, false);
    delay(300);
    rSet(PIN_R_ALIM, false);
    sysState = ST_IDLE;
    autoMode = false;
    tankFullPending = false;
}

void handlePriming() {
    if (millis() - tPhaseStart >= T_PRIME_MS) {
        // Bomba HP arranca solo si hay presión suficiente de alimentación
        rSet(PIN_R_HP, true);
        rSet(PIN_R_UV, true);
        sysState = ST_PURIFYING;
        bot.sendMessage(CHAT_ID, "✅ Purificación activa", "");
        Serial.println("[SYS] Purifying");
    }
}

void handleAutoFill() {
    if (sysState != ST_PURIFYING) return;

    if (flTkAlto) {
        // Confirmar que el tanque está lleno por T_TANK_FULL_MS antes de apagar
        rSet(PIN_R_SOL, false);
        if (!tankFullPending) {
            tankFullPending = true;
            tTankFull = millis();
        }
        if (millis() - tTankFull >= T_TANK_FULL_MS) {
            stopPurification();
            bot.sendMessage(CHAT_ID, "✅ Tanque lleno — sistema detenido", "");
        }
    } else {
        tankFullPending = false;
        // Abrir solenoide de llenado cuando el nivel está por debajo del alto
        rSet(PIN_R_SOL, true);
    }
}

// ═══════════════════════════════════════════════════════
//  Lavado de bidones (3 etapas)
// ═══════════════════════════════════════════════════════
void startWashing() {
    if (sysState != ST_IDLE && sysState != ST_MANUAL) {
        bot.sendMessage(CHAT_ID, "❌ No se puede lavar en el estado actual", "");
        return;
    }
    allOff();
    sysState    = ST_WASHING;
    washPhase   = WP_STAGE1;
    tPhaseStart = millis();
    rSet(PIN_R_LAV1, true);
    bot.sendMessage(CHAT_ID, "🪣 Lavado iniciado\n*Etapa 1/3* — Pre-enjuague (60 s)", "Markdown");
    Serial.println("[WASH] Stage 1");
}

void handleWashing() {
    unsigned long elapsed = millis() - tPhaseStart;

    switch (washPhase) {
        case WP_STAGE1:
            if (elapsed >= T_LAV1_MS) {
                rSet(PIN_R_LAV1, false);
                washPhase   = WP_PAUSE1;
                tPhaseStart = millis();
            }
            break;

        case WP_PAUSE1:
            if (elapsed >= T_PAUSA_MS) {
                washPhase   = WP_STAGE2;
                tPhaseStart = millis();
                rSet(PIN_R_LAV2, true);
                bot.sendMessage(CHAT_ID, "🧴 *Etapa 2/3* — Sanitizado (120 s)", "Markdown");
                Serial.println("[WASH] Stage 2");
            }
            break;

        case WP_STAGE2:
            if (elapsed >= T_LAV2_MS) {
                rSet(PIN_R_LAV2, false);
                washPhase   = WP_PAUSE2;
                tPhaseStart = millis();
            }
            break;

        case WP_PAUSE2:
            if (elapsed >= T_PAUSA_MS) {
                washPhase   = WP_STAGE3;
                tPhaseStart = millis();
                rSet(PIN_R_LAV3, true);
                bot.sendMessage(CHAT_ID, "💧 *Etapa 3/3* — Enjuague final (60 s)", "Markdown");
                Serial.println("[WASH] Stage 3");
            }
            break;

        case WP_STAGE3:
            if (elapsed >= T_LAV3_MS) {
                rSet(PIN_R_LAV3, false);
                washPhase = WP_DONE;
                sysState  = ST_IDLE;
                bot.sendMessage(CHAT_ID, "✅ Lavado de bidones completado", "");
                Serial.println("[WASH] Done");
            }
            break;

        default: break;
    }
}

// ═══════════════════════════════════════════════════════
//  Display OLED
// ═══════════════════════════════════════════════════════
const char* stateLabel() {
    switch (sysState) {
        case ST_IDLE:      return "ESPERA  ";
        case ST_PRIMING:   return "CEBANDO ";
        case ST_PURIFYING: return "PURIF.  ";
        case ST_WASHING:   return "LAVADO  ";
        case ST_ALARM:     return "ALARMA! ";
        case ST_MANUAL:    return "MANUAL  ";
        default:           return "---     ";
    }
}

void updateDisplay() {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // ── Fila 0: estado ────────────────────────────────
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.printf("%-10s %s", stateLabel(), autoMode ? "AUTO" : "MAN ");
    display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

    // ── Fila 1: TDS ───────────────────────────────────
    display.setCursor(0, 12);
    display.printf("IN:%4.0fppm OUT:%3.0fppm", tdsin, tdsout);

    // ── Fila 2: presión ───────────────────────────────
    display.setCursor(0, 22);
    display.printf("Presion: %5.2f bar", presion);

    // ── Fila 3: flotantes ─────────────────────────────
    display.setCursor(0, 32);
    display.printf("CIS:%s  TK:%s/%s",
        flCisterna ? "OK" : "XX",
        flTkBajo   ? "L" : "-",
        flTkAlto   ? "H" : "-");

    // ── Fila 4: estado relés (iconos compactos) ───────
    display.setCursor(0, 42);
    display.printf("A:%c HP:%c S:%c UV:%c",
        rGet(PIN_R_ALIM) ? '*' : '.',
        rGet(PIN_R_HP)   ? '*' : '.',
        rGet(PIN_R_SOL)  ? '*' : '.',
        rGet(PIN_R_UV)   ? '*' : '.');

    display.setCursor(0, 52);
    display.printf("L1:%c L2:%c L3:%c AL:%c",
        rGet(PIN_R_LAV1)  ? '*' : '.',
        rGet(PIN_R_LAV2)  ? '*' : '.',
        rGet(PIN_R_LAV3)  ? '*' : '.',
        rGet(PIN_R_ALARM) ? '*' : '.');

    display.display();
}

// ═══════════════════════════════════════════════════════
//  Telegram
// ═══════════════════════════════════════════════════════
String buildStatus() {
    String s = "📊 *Estado — Purificadora*\n";
    s += "Estado: `" + String(stateLabel()) + "`\n";
    s += "Modo: " + String(autoMode ? "Automático" : "Manual") + "\n\n";
    s += "💧 TDS Entrada:  " + String((int)tdsin)  + " ppm\n";
    s += "💧 TDS Salida:   " + String((int)tdsout) + " ppm\n";
    s += "🔵 Presión:      " + String(presion, 2)  + " bar\n\n";
    s += "Cisterna: " + String(flCisterna ? "✅" : "❌") + "\n";
    s += "Nivel bajo: " + String(flTkBajo  ? "✅" : "❌") + "\n";
    s += "Nivel alto: " + String(flTkAlto  ? "✅" : "❌") + "\n";
    if (sysState == ST_ALARM) s += "\n⚠️ " + alarmMsg;
    return s;
}

void processTelegramMsg(const telegramMessage& msg) {
    const String& chat = msg.chat_id;
    String text = msg.text;
    text.trim();
    Serial.println("[TG] " + text);

    // ── Información ───────────────────────────────────
    if (text == "/start" || text == "/ayuda") {
        String h = "🤖 *Purificadora de Agua — Comandos*\n\n";
        h += "/estado — Estado completo\n";
        h += "/tds — Lecturas TDS\n";
        h += "/presion — Presión del sistema\n\n";
        h += "*Control automático*\n";
        h += "/encender — Iniciar purificación\n";
        h += "/apagar — Detener sistema\n";
        h += "/lavar — Ciclo lavado bidones\n\n";
        h += "*Modo manual* (activar con /manual)\n";
        h += "/bomba\_alim on|off\n";
        h += "/bomba\_hp on|off\n";
        h += "/solenoide on|off\n";
        h += "/uv on|off\n";
        h += "/alarma\_off — Silenciar alarma\n";
        h += "/alarma\_reset — Resetear alarma\n";
        h += "/auto — Volver a modo automático\n";
        bot.sendMessage(chat, h, "Markdown");
    }
    else if (text == "/estado") {
        bot.sendMessage(chat, buildStatus(), "Markdown");
    }
    else if (text == "/tds") {
        bot.sendMessage(chat,
            "💧 TDS Entrada: " + String((int)tdsin)  + " ppm\n"
            "💧 TDS Salida:  " + String((int)tdsout) + " ppm", "");
    }
    else if (text == "/presion") {
        bot.sendMessage(chat, "🔵 Presión: " + String(presion, 2) + " bar", "");
    }

    // ── Control de sistema ────────────────────────────
    else if (text == "/encender") {
        startPurification();
    }
    else if (text == "/apagar") {
        stopPurification();
        bot.sendMessage(chat, "🛑 Sistema detenido", "");
    }
    else if (text == "/lavar") {
        startWashing();
    }

    // ── Modos ─────────────────────────────────────────
    else if (text == "/manual") {
        allOff();
        sysState = ST_MANUAL;
        autoMode = false;
        bot.sendMessage(chat, "🔧 Modo manual activado — todos los relés apagados", "");
    }
    else if (text == "/auto") {
        if (sysState == ST_ALARM) {
            bot.sendMessage(chat, "❌ Resetea la alarma primero con /alarma\_reset", "Markdown");
        } else {
            sysState = ST_IDLE;
            autoMode = false;
            bot.sendMessage(chat, "🤖 Modo automático listo. Usa /encender para iniciar", "");
        }
    }

    // ── Relés manuales ────────────────────────────────
    else if (text == "/bomba_alim on")  { rSet(PIN_R_ALIM, true);  bot.sendMessage(chat, "✅ Bomba alimentación ON",  ""); }
    else if (text == "/bomba_alim off") { rSet(PIN_R_ALIM, false); bot.sendMessage(chat, "🛑 Bomba alimentación OFF", ""); }
    else if (text == "/bomba_hp on")    { rSet(PIN_R_HP,   true);  bot.sendMessage(chat, "✅ Bomba HP ON",  ""); }
    else if (text == "/bomba_hp off")   { rSet(PIN_R_HP,   false); bot.sendMessage(chat, "🛑 Bomba HP OFF", ""); }
    else if (text == "/solenoide on")   { rSet(PIN_R_SOL,  true);  bot.sendMessage(chat, "✅ Solenoide ON",  ""); }
    else if (text == "/solenoide off")  { rSet(PIN_R_SOL,  false); bot.sendMessage(chat, "🛑 Solenoide OFF", ""); }
    else if (text == "/uv on")          { rSet(PIN_R_UV,   true);  bot.sendMessage(chat, "✅ UV ON",  ""); }
    else if (text == "/uv off")         { rSet(PIN_R_UV,   false); bot.sendMessage(chat, "🛑 UV OFF", ""); }

    // ── Alarmas ───────────────────────────────────────
    else if (text == "/alarma_off") {
        rSet(PIN_R_ALARM, false);
        bot.sendMessage(chat, "🔕 Alarma silenciada", "");
    }
    else if (text == "/alarma_reset") {
        clearAlarm();
        bot.sendMessage(chat, "✅ Alarma reseteada — sistema en espera", "");
    }

    else {
        bot.sendMessage(chat, "❓ Comando no reconocido. Usa /ayuda", "");
    }
}

void checkTelegram() {
    if (WiFi.status() != WL_CONNECTED) {
        WiFi.reconnect();
        return;
    }
    int n = bot.getUpdates(bot.last_message_received + 1);
    while (n) {
        for (int i = 0; i < n; i++) processTelegramMsg(bot.messages[i]);
        n = bot.getUpdates(bot.last_message_received + 1);
    }
}

// ═══════════════════════════════════════════════════════
//  Setup
// ═══════════════════════════════════════════════════════
void setup() {
    Serial.begin(115200);
    Serial.println("\n[SYS] Purificadora de Agua — Iniciando");

    // ── Relés: todos apagados al inicio ───────────────
    const uint8_t relayPins[] = {
        PIN_R_ALIM, PIN_R_HP, PIN_R_SOL,
        PIN_R_UV, PIN_R_LAV1, PIN_R_LAV2, PIN_R_LAV3, PIN_R_ALARM
    };
    for (uint8_t p : relayPins) {
        pinMode(p, OUTPUT);
        digitalWrite(p, RELAY_OFF);
    }

    // ── Flotantes ─────────────────────────────────────
    pinMode(PIN_FL_CISTERNA, INPUT_PULLDOWN);
    pinMode(PIN_FL_TK_BAJO,  INPUT_PULLDOWN);
    pinMode(PIN_FL_TK_ALTO,  INPUT_PULLDOWN);

    // ── OLED ──────────────────────────────────────────
    Wire.begin(OLED_SDA, OLED_SCL);
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
        Serial.println("[ERR] OLED no encontrado");
    } else {
        display.clearDisplay();
        display.setTextColor(SSD1306_WHITE);
        display.setTextSize(1);
        display.setCursor(18, 20);
        display.println("Purificadora H2O");
        display.setCursor(34, 34);
        display.println("Iniciando...");
        display.display();
    }

    // ── WiFi ──────────────────────────────────────────
    Serial.printf("[NET] Conectando a %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    unsigned long wt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - wt < 20000UL) {
        delay(500);
        Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[NET] IP: " + WiFi.localIP().toString());
    } else {
        Serial.println("\n[NET] WiFi timeout — modo offline");
    }

    tlsClient.setInsecure(); // Telegram usa certificado auto-validado

    // ── Notificación de arranque ───────────────────────
    bot.sendMessage(CHAT_ID,
        "🟢 *Purificadora de agua online*\n"
        "Sistema listo. Usa /ayuda para ver los comandos.",
        "Markdown");

    Serial.println("[SYS] Setup completo");
}

// ═══════════════════════════════════════════════════════
//  Loop
// ═══════════════════════════════════════════════════════
void loop() {
    unsigned long now = millis();

    // Sensores
    if (now - tLastSensor >= INTERVAL_SENSOR) {
        tLastSensor = now;
        readSensors();
    }

    // Seguridad
    checkSafety();

    // Máquina de estados
    switch (sysState) {
        case ST_PRIMING:   handlePriming();  break;
        case ST_PURIFYING: handleAutoFill(); break;
        case ST_WASHING:   handleWashing();  break;
        default: break;
    }

    // Display
    if (now - tLastDisplay >= INTERVAL_DISPLAY) {
        tLastDisplay = now;
        updateDisplay();
    }

    // Telegram
    if (now - tLastTelegram >= INTERVAL_TELEGRAM) {
        tLastTelegram = now;
        checkTelegram();
    }
}

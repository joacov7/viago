#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>
#include <Preferences.h>
#include <LittleFS.h>
#include <time.h>
#include "config.h"

// ═══════════════════════════════════════════════════════
//  Tipos
// ═══════════════════════════════════════════════════════
enum SysState {
    ST_IDLE,
    ST_PRIMING,
    ST_PURIFYING,
    ST_WASHING,
    ST_ALARM,
    ST_MANUAL,
    ST_STANDBY
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
AsyncWebServer     server(80);
AsyncWebSocket     ws("/ws");
Preferences        prefs;

SysState  sysState  = ST_IDLE;
WashPhase washPhase = WP_IDLE;
bool      autoMode  = false;

float tdsin      = 0.0f;
float tdsout     = 0.0f;
float presion    = 0.0f;
bool  flCisterna = false;
bool  flTkBajo   = false;
bool  flTkAlto   = false;

unsigned long tLastSensor    = 0;
unsigned long tLastDisplay   = 0;
unsigned long tLastTelegram  = 0;
unsigned long tLastWs        = 0;
unsigned long tLastSupabase  = 0;
unsigned long tLastCmdPoll   = 0;
unsigned long tPhaseStart    = 0;
unsigned long tTankFull      = 0;
bool          tankFullPending = false;

String alarmMsg = "";

// ── Programación horaria ────────────────────────────────────
bool    schedEnabled = false;
uint8_t schedOnH = 8,  schedOnM = 0;
uint8_t schedOffH = 18, schedOffM = 0;
int     lastSchedMin   = -1;
unsigned long tLastSchedule = 0;

// ── Contadores de uso ─────────────────────────────────
uint32_t secMembrane    = 0;
uint32_t secUV          = 0;
bool     warnedMembrane = false;
bool     warnedUV       = false;
unsigned long tLastCounter = 0;
unsigned long tLastNvsSave = 0;

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
//  Sensores
// ═══════════════════════════════════════════════════════
float calcTDS(uint8_t pin) {
    long sum = 0;
    for (int i = 0; i < 10; i++) sum += analogRead(pin);
    float voltage = (sum / 10.0f / 4095.0f) * 3.3f;
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
//  NTP / Tiempo
// ═══════════════════════════════════════════════════════
String getTimeStr() {
    struct tm ti;
    if (!getLocalTime(&ti)) return "--:--";
    char buf[6];
    strftime(buf, sizeof(buf), "%H:%M", &ti);
    return String(buf);
}

String getDateTimeStr() {
    struct tm ti;
    if (!getLocalTime(&ti)) return "????-??-?? ??:??:??";
    char buf[20];
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &ti);
    return String(buf);
}

// ═══════════════════════════════════════════════════════
//  Log de alarmas (LittleFS)
// ═══════════════════════════════════════════════════════
void logAlarm(const String& msg) {
    File f = LittleFS.open(ALARM_LOG_FILE, "a");
    if (!f) return;
    f.println(getDateTimeStr() + " | " + msg);
    f.close();

    File fr = LittleFS.open(ALARM_LOG_FILE, "r");
    if (!fr) return;
    String lines[ALARM_LOG_MAX + 10];
    int count = 0;
    while (fr.available() && count < ALARM_LOG_MAX + 10) {
        String line = fr.readStringUntil('\n');
        line.trim();
        if (line.length() > 0) lines[count++] = line;
    }
    fr.close();

    if (count > ALARM_LOG_MAX) {
        File fw = LittleFS.open(ALARM_LOG_FILE, "w");
        if (fw) {
            for (int i = count - ALARM_LOG_MAX; i < count; i++)
                fw.println(lines[i]);
            fw.close();
        }
    }
}

String readAlarmLogJson(int lastN = 20) {
    StaticJsonDocument<2048> doc;
    JsonArray arr = doc.to<JsonArray>();
    String out;
    if (!LittleFS.exists(ALARM_LOG_FILE)) { serializeJson(doc, out); return out; }
    File f = LittleFS.open(ALARM_LOG_FILE, "r");
    if (!f) { serializeJson(doc, out); return out; }

    String lines[ALARM_LOG_MAX];
    int count = 0;
    while (f.available() && count < ALARM_LOG_MAX) {
        String line = f.readStringUntil('\n');
        line.trim();
        if (line.length() > 0) lines[count++] = line;
    }
    f.close();

    int start = max(0, count - lastN);
    for (int i = count - 1; i >= start; i--) {
        int sep = lines[i].indexOf(" | ");
        if (sep > 0) {
            JsonObject entry = arr.createNestedObject();
            entry["ts"]  = lines[i].substring(0, sep);
            entry["msg"] = lines[i].substring(sep + 3);
        }
    }
    serializeJson(doc, out);
    return out;
}

// ═══════════════════════════════════════════════════════
//  Persistencia (NVS)
// ═══════════════════════════════════════════════════════
void loadPrefs() {
    prefs.begin("purif", true);
    secMembrane  = prefs.getUInt("mem_sec",    0);
    secUV        = prefs.getUInt("uv_sec",     0);
    schedEnabled = prefs.getBool("sched_en",   false);
    schedOnH     = prefs.getUChar("sched_onh", 8);
    schedOnM     = prefs.getUChar("sched_onm", 0);
    schedOffH    = prefs.getUChar("sched_offh",18);
    schedOffM    = prefs.getUChar("sched_offm",0);
    prefs.end();
}

void saveCounters() {
    prefs.begin("purif", false);
    prefs.putUInt("mem_sec", secMembrane);
    prefs.putUInt("uv_sec",  secUV);
    prefs.end();
}

void saveSchedule() {
    prefs.begin("purif", false);
    prefs.putBool("sched_en",    schedEnabled);
    prefs.putUChar("sched_onh",  schedOnH);
    prefs.putUChar("sched_onm",  schedOnM);
    prefs.putUChar("sched_offh", schedOffH);
    prefs.putUChar("sched_offm", schedOffM);
    prefs.end();
}

void resetCounter(const String& which) {
    if (which == "membrane") { secMembrane = 0; warnedMembrane = false; }
    else if (which == "uv")  { secUV = 0;       warnedUV = false; }
    saveCounters();
}

// ═══════════════════════════════════════════════════════
//  Contadores de uso
// ═══════════════════════════════════════════════════════
void updateCounters() {
    if (rGet(PIN_R_HP)) secMembrane++;
    if (rGet(PIN_R_UV)) secUV++;

    float memH = secMembrane / 3600.0f;
    float uvH  = secUV       / 3600.0f;

    if (!warnedMembrane && memH >= MEMBRANE_WARN_H) {
        warnedMembrane = true;
        bot.sendMessage(CHAT_ID,
            "⚠️ *Mantenimiento*: Membrana RO llegó a " +
            String((int)memH) + " h. Revisar reemplazo.", "Markdown");
    }
    if (!warnedUV && uvH >= UV_WARN_H) {
        warnedUV = true;
        bot.sendMessage(CHAT_ID,
            "⚠️ *Mantenimiento*: Lámpara UV llegó a " +
            String((int)uvH) + " h. Revisar reemplazo.", "Markdown");
    }
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
    logAlarm(msg);
    bot.sendMessage(CHAT_ID, "⚠️ ALARMA: " + msg, "");
    Serial.println("[ALARM] " + msg);
}

void clearAlarm() {
    rSet(PIN_R_ALARM, false);
    sysState = ST_IDLE;
    alarmMsg = "";
}

// ═══════════════════════════════════════════════════════
//  Seguridad
// ═══════════════════════════════════════════════════════
void checkSafety() {
    if (sysState == ST_ALARM || sysState == ST_MANUAL) return;

    if (!flCisterna) { triggerAlarm("Cisterna sin agua"); return; }

    if (sysState == ST_PURIFYING) {
        if (presion > PRES_SAFE_MAX) {
            triggerAlarm("Presión alta: " + String(presion, 1) + " bar"); return;
        }
        if (presion < PRES_SAFE_MIN) {
            triggerAlarm("Presión baja: " + String(presion, 1) + " bar"); return;
        }
        if (tdsout > TDS_OUT_MAX_PPM) {
            triggerAlarm("TDS salida alto: " + String((int)tdsout) + " ppm"); return;
        }
    }
}

// ═══════════════════════════════════════════════════════
//  Control de purificación
// ═══════════════════════════════════════════════════════
void startPurification() {
    if (sysState == ST_ALARM || sysState == ST_WASHING) return;
    allOff();
    sysState        = ST_PRIMING;
    autoMode        = true;
    tPhaseStart     = millis();
    tankFullPending = false;
    rSet(PIN_R_ALIM, true);
    bot.sendMessage(CHAT_ID, "⏳ Cebando bomba de alimentación...", "");
}

void stopPurification() {
    rSet(PIN_R_HP,  false);
    rSet(PIN_R_SOL, false);
    rSet(PIN_R_UV,  false);
    delay(300);
    rSet(PIN_R_ALIM, false);
    sysState        = ST_IDLE;
    autoMode        = false;
    tankFullPending = false;
}

void handlePriming() {
    if (millis() - tPhaseStart >= T_PRIME_MS) {
        rSet(PIN_R_HP, true);
        rSet(PIN_R_UV, true);
        sysState = ST_PURIFYING;
        bot.sendMessage(CHAT_ID, "✅ Purificación activa", "");
    }
}

void handleAutoFill() {
    if (sysState != ST_PURIFYING) return;
    if (flTkAlto) {
        rSet(PIN_R_SOL, false);
        if (!tankFullPending) { tankFullPending = true; tTankFull = millis(); }
        if (millis() - tTankFull >= T_TANK_FULL_MS) {
            stopPurification();
            bot.sendMessage(CHAT_ID, "✅ Tanque lleno — sistema detenido", "");
        }
    } else {
        tankFullPending = false;
        rSet(PIN_R_SOL, true);
    }
}

// ═══════════════════════════════════════════════════════
//  Lavado de bidones (3 etapas)
// ═══════════════════════════════════════════════════════
void startWashing() {
    if (sysState != ST_IDLE && sysState != ST_MANUAL && sysState != ST_STANDBY) {
        bot.sendMessage(CHAT_ID, "❌ No se puede lavar en el estado actual", "");
        return;
    }
    allOff();
    sysState    = ST_WASHING;
    washPhase   = WP_STAGE1;
    tPhaseStart = millis();
    rSet(PIN_R_LAV1, true);
    bot.sendMessage(CHAT_ID, "🪣 Lavado iniciado\n*Etapa 1/3* — Pre-enjuague (60 s)", "Markdown");
}

void handleWashing() {
    unsigned long elapsed = millis() - tPhaseStart;
    switch (washPhase) {
        case WP_STAGE1:
            if (elapsed >= T_LAV1_MS) {
                rSet(PIN_R_LAV1, false); washPhase = WP_PAUSE1; tPhaseStart = millis();
            }
            break;
        case WP_PAUSE1:
            if (elapsed >= T_PAUSA_MS) {
                washPhase = WP_STAGE2; tPhaseStart = millis();
                rSet(PIN_R_LAV2, true);
                bot.sendMessage(CHAT_ID, "🧴 *Etapa 2/3* — Sanitizado (120 s)", "Markdown");
            }
            break;
        case WP_STAGE2:
            if (elapsed >= T_LAV2_MS) {
                rSet(PIN_R_LAV2, false); washPhase = WP_PAUSE2; tPhaseStart = millis();
            }
            break;
        case WP_PAUSE2:
            if (elapsed >= T_PAUSA_MS) {
                washPhase = WP_STAGE3; tPhaseStart = millis();
                rSet(PIN_R_LAV3, true);
                bot.sendMessage(CHAT_ID, "💧 *Etapa 3/3* — Enjuague final (60 s)", "Markdown");
            }
            break;
        case WP_STAGE3:
            if (elapsed >= T_LAV3_MS) {
                rSet(PIN_R_LAV3, false);
                washPhase = WP_DONE;
                sysState  = ST_IDLE;
                bot.sendMessage(CHAT_ID, "✅ Lavado de bidones completado", "");
            }
            break;
        default: break;
    }
}

// ═══════════════════════════════════════════════════════
//  Programación horaria
// ═══════════════════════════════════════════════════════
void checkSchedule() {
    if (!schedEnabled || sysState == ST_ALARM) return;
    struct tm ti;
    if (!getLocalTime(&ti)) return;

    int nowMin = ti.tm_hour * 60 + ti.tm_min;
    if (nowMin == lastSchedMin) return;

    int onMin  = schedOnH  * 60 + schedOnM;
    int offMin = schedOffH * 60 + schedOffM;

    if (nowMin == onMin) {
        lastSchedMin = nowMin;
        if (sysState == ST_IDLE || sysState == ST_STANDBY) {
            startPurification();
            bot.sendMessage(CHAT_ID, "⏰ Arranque programado", "");
        }
    } else if (nowMin == offMin) {
        lastSchedMin = nowMin;
        if (sysState == ST_PURIFYING || sysState == ST_PRIMING) {
            stopPurification();
            sysState = ST_STANDBY;
            bot.sendMessage(CHAT_ID, "⏰ Parada programada — modo standby", "");
        }
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
        case ST_STANDBY:   return "STANDBY ";
        default:           return "---     ";
    }
}

void updateDisplay() {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);

    if (sysState == ST_STANDBY) {
        display.setCursor(0, 0);
        display.printf("STANDBY      %s", getTimeStr().c_str());
        display.drawLine(0, 9, 127, 9, SSD1306_WHITE);
        display.setCursor(0, 12);
        if (schedEnabled)
            display.printf("ON %02d:%02d  OFF %02d:%02d",
                schedOnH, schedOnM, schedOffH, schedOffM);
        else
            display.print("Sin horario programado");
        display.setCursor(0, 24);
        display.printf("Membrana:%7.1f h", secMembrane / 3600.0f);
        display.setCursor(0, 34);
        display.printf("UV:      %7.1f h", secUV / 3600.0f);
        display.setCursor(0, 44);
        display.printf("TDS IN: %4.0f ppm", tdsin);
        display.setCursor(0, 54);
        display.print("WiFi: OK");
    } else {
        display.setCursor(0, 0);
        display.printf("%-10s %s", stateLabel(), autoMode ? "AUTO" : "MAN ");
        display.drawLine(0, 9, 127, 9, SSD1306_WHITE);
        display.setCursor(0, 12);
        display.printf("IN:%4.0fppm OUT:%3.0fppm", tdsin, tdsout);
        display.setCursor(0, 22);
        display.printf("Presion: %5.2f bar", presion);
        display.setCursor(0, 32);
        display.printf("CIS:%s  TK:%s/%s",
            flCisterna ? "OK" : "XX",
            flTkBajo   ? "L"  : "-",
            flTkAlto   ? "H"  : "-");
        display.setCursor(0, 42);
        display.printf("A:%c HP:%c S:%c UV:%c",
            rGet(PIN_R_ALIM) ? '*' : '.',
            rGet(PIN_R_HP)   ? '*' : '.',
            rGet(PIN_R_SOL)  ? '*' : '.',
            rGet(PIN_R_UV)   ? '*' : '.');
        display.setCursor(0, 52);
        display.printf("%s M:%4.0fh UV:%4.0fh",
            getTimeStr().c_str(),
            secMembrane / 3600.0f,
            secUV / 3600.0f);
    }
    display.display();
}

// ═══════════════════════════════════════════════════════
//  Forward declaration
// ═══════════════════════════════════════════════════════
void handleWebCmd(const String& cmd);

// ═══════════════════════════════════════════════════════
//  Supabase — push estado + poll comandos
// ═══════════════════════════════════════════════════════
void pushToSupabase() {
    if (WiFi.status() != WL_CONNECTED) return;
    WiFiClientSecure sc;
    sc.setInsecure();
    HTTPClient http;
    http.begin(sc, String(SUPABASE_URL) + "/rest/v1/purif_status");
    http.addHeader("Content-Type",  "application/json");
    http.addHeader("apikey",        SUPABASE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    http.addHeader("Prefer",        "resolution=merge-duplicates,return=minimal");

    DynamicJsonDocument outer(2048);
    outer["device_id"] = "main";
    JsonObject pay = outer.createNestedObject("payload");
    pay["state"]    = stateLabel();
    pay["autoMode"] = autoMode;
    pay["tdsIn"]    = (int)tdsin;
    pay["tdsOut"]   = (int)tdsout;
    pay["pressure"] = (float)(round(presion * 100) / 100.0);
    pay["alarm"]    = alarmMsg;
    pay["time"]     = getTimeStr();
    pay["memSec"]   = secMembrane;
    pay["uvSec"]    = secUV;
    JsonObject sched = pay.createNestedObject("schedule");
    sched["enabled"] = schedEnabled;
    sched["onH"]     = schedOnH;
    sched["onM"]     = schedOnM;
    sched["offH"]    = schedOffH;
    sched["offM"]    = schedOffM;
    JsonObject fl = pay.createNestedObject("floats");
    fl["cisterna"] = flCisterna;
    fl["tankLow"]  = flTkBajo;
    fl["tankHigh"] = flTkAlto;
    JsonObject rl = pay.createNestedObject("relays");
    rl["alim"]  = rGet(PIN_R_ALIM);
    rl["hp"]    = rGet(PIN_R_HP);
    rl["sol"]   = rGet(PIN_R_SOL);
    rl["uv"]    = rGet(PIN_R_UV);
    rl["lav1"]  = rGet(PIN_R_LAV1);
    rl["lav2"]  = rGet(PIN_R_LAV2);
    rl["lav3"]  = rGet(PIN_R_LAV3);
    rl["alarm"] = rGet(PIN_R_ALARM);

    String body;
    serializeJson(outer, body);
    int code = http.POST(body);
    Serial.printf("[SUPA] push %d\n", code);
    http.end();
    sc.stop();
}

void pollCommands() {
    if (WiFi.status() != WL_CONNECTED) return;
    WiFiClientSecure sc;
    sc.setInsecure();
    HTTPClient http;
    http.begin(sc, String(SUPABASE_URL) +
        "/rest/v1/purif_commands?executed=eq.false&order=id.asc&limit=1");
    http.addHeader("apikey",        SUPABASE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    int code = http.GET();
    if (code == 200) {
        String resp = http.getString();
        DynamicJsonDocument doc(512);
        if (deserializeJson(doc, resp) == DeserializationError::Ok
            && doc.is<JsonArray>() && doc.size() > 0) {
            JsonObject row = doc[0];
            long cmdId = row["id"].as<long>();
            String cmd = row["cmd"].as<String>();

            if (cmd == "set_schedule" && row.containsKey("params")) {
                JsonObject p = row["params"];
                if (p.containsKey("enabled")) schedEnabled = p["enabled"].as<bool>();
                if (p.containsKey("onH"))     schedOnH  = p["onH"].as<int>();
                if (p.containsKey("onM"))     schedOnM  = p["onM"].as<int>();
                if (p.containsKey("offH"))    schedOffH = p["offH"].as<int>();
                if (p.containsKey("offM"))    schedOffM = p["offM"].as<int>();
                saveSchedule();
            } else if (cmd == "reset_membrane") {
                resetCounter("membrane");
            } else if (cmd == "reset_uv") {
                resetCounter("uv");
            } else {
                handleWebCmd(cmd);
            }

            http.end();
            http.begin(sc, String(SUPABASE_URL) +
                "/rest/v1/purif_commands?id=eq." + String(cmdId));
            http.addHeader("Content-Type",  "application/json");
            http.addHeader("apikey",        SUPABASE_KEY);
            http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
            http.addHeader("Prefer",        "return=minimal");
            http.sendRequest("PATCH", "{\"executed\":true}");
        }
    }
    http.end();
    sc.stop();
}

// ═══════════════════════════════════════════════════════
//  Telegram — send (usa tlsClient global)
// ═══════════════════════════════════════════════════════
String buildTelegramStatus() {
    String s = "📊 *Estado — Purificadora*\n";
    s += "Estado: `" + String(stateLabel()) + "`\n";
    s += "Modo: " + String(autoMode ? "Automático" : "Manual") + "\n";
    s += "Hora: " + getTimeStr() + "\n\n";
    s += "💧 TDS Entrada: " + String((int)tdsin)  + " ppm\n";
    s += "💧 TDS Salida:  " + String((int)tdsout) + " ppm\n";
    s += "🔵 Presión:     " + String(presion, 2)  + " bar\n\n";
    s += "Cisterna: "   + String(flCisterna ? "✅" : "❌") + "\n";
    s += "Nivel bajo: " + String(flTkBajo   ? "✅" : "❌") + "\n";
    s += "Nivel alto: " + String(flTkAlto   ? "✅" : "❌") + "\n\n";
    s += "🔧 *Mantenimiento*\n";
    s += "Membrana: " + String(secMembrane / 3600.0f, 1) + " h";
    if (secMembrane / 3600 >= MEMBRANE_WARN_H) s += " ⚠️";
    s += "\n";
    s += "UV: " + String(secUV / 3600.0f, 1) + " h";
    if (secUV / 3600 >= UV_WARN_H) s += " ⚠️";
    s += "\n";
    if (schedEnabled) {
        char buf[32];
        snprintf(buf, sizeof(buf), "%02d:%02d → %02d:%02d",
            schedOnH, schedOnM, schedOffH, schedOffM);
        s += "\n⏰ *Horario:* " + String(buf);
    }
    if (sysState == ST_ALARM) s += "\n\n⚠️ " + alarmMsg;
    return s;
}

void processTelegramMsg(const String& chatId, const String& text) {
    Serial.printf("[TG] cmd='%s'\n", text.c_str());

    if (text == "/start" || text == "/ayuda") {
        String h = "🤖 *Purificadora — Comandos*\n\n";
        h += "📊 *Información*\n";
        h += "/estado — Estado completo\n";
        h += "/tds — Lecturas TDS\n";
        h += "/presion — Presión\n";
        h += "/horas — Horas de uso\n";
        h += "/alarmas — Historial de alarmas\n\n";
        h += "⚙️ *Control automático*\n";
        h += "/encender — Iniciar purificación\n";
        h += "/apagar — Detener sistema\n";
        h += "/lavar — Ciclo lavado bidones\n";
        h += "/standby — Modo reposo\n\n";
        h += "⏰ *Programación horaria*\n";
        h += "/horario — Ver horario actual\n";
        h += "/horario HH:MM HH:MM — Fijar encendido/apagado\n";
        h += "/horario off — Desactivar\n\n";
        h += "🔧 *Modo manual*\n";
        h += "/manual — Activar modo manual\n";
        h += "/auto — Volver a automático\n";
        h += "/bomba\\_alim on|off\n";
        h += "/bomba\\_hp on|off\n";
        h += "/solenoide on|off\n";
        h += "/uv on|off\n\n";
        h += "🔴 *Alarmas y mantenimiento*\n";
        h += "/alarma\\_off — Silenciar\n";
        h += "/alarma\\_reset — Resetear\n";
        h += "/reset\\_membrana — Resetear contador membrana\n";
        h += "/reset\\_uv — Resetear contador UV\n";
        bot.sendMessage(chatId, h, "Markdown");
    }
    else if (text == "/estado")  { bot.sendMessage(chatId, buildTelegramStatus(), "Markdown"); }
    else if (text == "/tds") {
        bot.sendMessage(chatId,
            "💧 TDS Entrada: " + String((int)tdsin)  + " ppm\n"
            "💧 TDS Salida:  " + String((int)tdsout) + " ppm", "");
    }
    else if (text == "/presion") {
        bot.sendMessage(chatId, "🔵 Presión: " + String(presion, 2) + " bar", "");
    }
    else if (text == "/horas") {
        String h = "🔧 *Horas de uso*\n";
        h += "Membrana RO: " + String(secMembrane / 3600.0f, 1) + " h";
        h += (secMembrane / 3600 >= MEMBRANE_WARN_H ? " ⚠️ CAMBIAR" : "");
        h += "\nLámpara UV:  " + String(secUV / 3600.0f, 1) + " h";
        h += (secUV / 3600 >= UV_WARN_H ? " ⚠️ CAMBIAR" : "");
        bot.sendMessage(chatId, h, "Markdown");
    }
    else if (text == "/alarmas") {
        if (!LittleFS.exists(ALARM_LOG_FILE)) {
            bot.sendMessage(chatId, "Sin alarmas registradas.", ""); return;
        }
        File f = LittleFS.open(ALARM_LOG_FILE, "r");
        if (!f) { bot.sendMessage(chatId, "Error al leer log.", ""); return; }
        String lines[ALARM_LOG_MAX];
        int count = 0;
        while (f.available() && count < ALARM_LOG_MAX) {
            String line = f.readStringUntil('\n');
            line.trim();
            if (line.length() > 0) lines[count++] = line;
        }
        f.close();
        String resp = "🔴 *Últimas alarmas*\n\n";
        int start = max(0, count - 5);
        for (int i = start; i < count; i++) resp += lines[i] + "\n";
        if (count == 0) resp = "Sin alarmas registradas.";
        bot.sendMessage(chatId, resp, "Markdown");
    }
    else if (text == "/encender") { startPurification(); }
    else if (text == "/apagar")   { stopPurification(); bot.sendMessage(chatId, "🛑 Sistema detenido", ""); }
    else if (text == "/lavar")    { startWashing(); }
    else if (text == "/standby")  {
        allOff(); sysState = ST_STANDBY; autoMode = false;
        bot.sendMessage(chatId, "💤 Modo standby activado", "");
    }
    else if (text == "/manual") {
        allOff(); sysState = ST_MANUAL; autoMode = false;
        bot.sendMessage(chatId, "🔧 Modo manual activado", "");
    }
    else if (text == "/auto") {
        if (sysState == ST_ALARM)
            bot.sendMessage(chatId, "❌ Resetea la alarma primero con /alarma\\_reset", "Markdown");
        else { sysState = ST_IDLE; autoMode = false; bot.sendMessage(chatId, "🤖 Modo automático listo", ""); }
    }
    else if (text.startsWith("/horario")) {
        String arg = text.substring(8); arg.trim();
        if (arg.isEmpty()) {
            char buf[64];
            snprintf(buf, sizeof(buf), "Estado: %s\nEncendido: %02d:%02d\nApagado:   %02d:%02d",
                schedEnabled ? "✅ Activa" : "❌ Inactiva",
                schedOnH, schedOnM, schedOffH, schedOffM);
            bot.sendMessage(chatId, "⏰ *Programación*\n" + String(buf), "Markdown");
        } else if (arg == "off") {
            schedEnabled = false; saveSchedule();
            bot.sendMessage(chatId, "⏰ Programación desactivada", "");
        } else {
            int sp = arg.indexOf(' ');
            if (sp > 0) {
                String onStr  = arg.substring(0, sp);
                String offStr = arg.substring(sp + 1);
                int c1 = onStr.indexOf(':'), c2 = offStr.indexOf(':');
                if (c1 > 0 && c2 > 0) {
                    schedOnH  = onStr.substring(0, c1).toInt();
                    schedOnM  = onStr.substring(c1+1).toInt();
                    schedOffH = offStr.substring(0, c2).toInt();
                    schedOffM = offStr.substring(c2+1).toInt();
                    schedEnabled = true;
                    saveSchedule();
                    bot.sendMessage(chatId, "⏰ Programación guardada: ON " + onStr + " OFF " + offStr, "");
                } else {
                    bot.sendMessage(chatId, "❌ Formato: /horario HH:MM HH:MM", "");
                }
            } else {
                bot.sendMessage(chatId, "❌ Formato: /horario HH:MM HH:MM", "");
            }
        }
    }
    else if (text == "/bomba_alim on")  { rSet(PIN_R_ALIM, true);  bot.sendMessage(chatId, "✅ Bomba alim ON",  ""); }
    else if (text == "/bomba_alim off") { rSet(PIN_R_ALIM, false); bot.sendMessage(chatId, "🛑 Bomba alim OFF", ""); }
    else if (text == "/bomba_hp on")    { rSet(PIN_R_HP,   true);  bot.sendMessage(chatId, "✅ Bomba HP ON",  ""); }
    else if (text == "/bomba_hp off")   { rSet(PIN_R_HP,   false); bot.sendMessage(chatId, "🛑 Bomba HP OFF", ""); }
    else if (text == "/solenoide on")   { rSet(PIN_R_SOL,  true);  bot.sendMessage(chatId, "✅ Solenoide ON",  ""); }
    else if (text == "/solenoide off")  { rSet(PIN_R_SOL,  false); bot.sendMessage(chatId, "🛑 Solenoide OFF", ""); }
    else if (text == "/uv on")          { rSet(PIN_R_UV,   true);  bot.sendMessage(chatId, "✅ UV ON",  ""); }
    else if (text == "/uv off")         { rSet(PIN_R_UV,   false); bot.sendMessage(chatId, "🛑 UV OFF", ""); }
    else if (text == "/alarma_off")   { rSet(PIN_R_ALARM, false); bot.sendMessage(chatId, "🔕 Alarma silenciada", ""); }
    else if (text == "/alarma_reset") { clearAlarm(); bot.sendMessage(chatId, "✅ Alarma reseteada", ""); }
    else if (text == "/reset_membrana") {
        resetCounter("membrane");
        bot.sendMessage(chatId, "✅ Contador de membrana reseteado a 0 h", "");
    }
    else if (text == "/reset_uv") {
        resetCounter("uv");
        bot.sendMessage(chatId, "✅ Contador UV reseteado a 0 h", "");
    }
    else { bot.sendMessage(chatId, "❓ Comando no reconocido. Usa /ayuda", ""); }
}

// Polling manual con sc local — mismo patrón que Supabase
void checkTelegram() {
    if (WiFi.status() != WL_CONNECTED) { WiFi.reconnect(); return; }

    WiFiClientSecure sc;
    sc.setInsecure();
    HTTPClient http;
    String url = "https://api.telegram.org/bot" + String(BOT_TOKEN) +
                 "/getUpdates?offset=" + String(bot.last_message_received + 1) +
                 "&limit=5&timeout=0";
    http.begin(sc, url);
    http.setTimeout(8000);
    int code = http.GET();
    Serial.printf("[TG] HTTP %d\n", code);

    if (code == 200) {
        String body = http.getString();
        // Primeros 200 chars para debug
        Serial.println("[TG] " + body.substring(0, 200));

        DynamicJsonDocument doc(4096);
        if (deserializeJson(doc, body) == DeserializationError::Ok
            && doc["ok"].as<bool>()) {
            JsonArray results = doc["result"].as<JsonArray>();
            for (JsonObject upd : results) {
                long uid = upd["update_id"].as<long>();
                if (uid > bot.last_message_received) {
                    bot.last_message_received = uid;
                }
                if (upd.containsKey("message")) {
                    JsonObject m = upd["message"];
                    String text   = m["text"] | "";
                    String chatId = String(m["chat"]["id"].as<long>());
                    text.trim();
                    if (text.length() > 0) processTelegramMsg(chatId, text);
                }
            }
        }
    }
    http.end();
    sc.stop();
}

// ═══════════════════════════════════════════════════════
//  Web Server + WebSocket
// ═══════════════════════════════════════════════════════
String buildStatusJson() {
    StaticJsonDocument<768> doc;
    doc["state"]    = stateLabel();
    doc["autoMode"] = autoMode;
    doc["tdsIn"]    = (int)tdsin;
    doc["tdsOut"]   = (int)tdsout;
    doc["pressure"] = (float)(round(presion * 100) / 100.0);
    doc["alarm"]    = alarmMsg;
    doc["time"]     = getTimeStr();
    doc["memSec"]   = secMembrane;
    doc["uvSec"]    = secUV;

    JsonObject sched = doc.createNestedObject("schedule");
    sched["enabled"] = schedEnabled;
    sched["onH"]     = schedOnH;
    sched["onM"]     = schedOnM;
    sched["offH"]    = schedOffH;
    sched["offM"]    = schedOffM;

    JsonObject fl = doc.createNestedObject("floats");
    fl["cisterna"] = flCisterna;
    fl["tankLow"]  = flTkBajo;
    fl["tankHigh"] = flTkAlto;

    JsonObject rl = doc.createNestedObject("relays");
    rl["alim"]  = rGet(PIN_R_ALIM);
    rl["hp"]    = rGet(PIN_R_HP);
    rl["sol"]   = rGet(PIN_R_SOL);
    rl["uv"]    = rGet(PIN_R_UV);
    rl["lav1"]  = rGet(PIN_R_LAV1);
    rl["lav2"]  = rGet(PIN_R_LAV2);
    rl["lav3"]  = rGet(PIN_R_LAV3);
    rl["alarm"] = rGet(PIN_R_ALARM);

    String out;
    serializeJson(doc, out);
    return out;
}

void handleWebCmd(const String& cmd) {
    if      (cmd == "encender")     startPurification();
    else if (cmd == "apagar")       stopPurification();
    else if (cmd == "lavar")        startWashing();
    else if (cmd == "alarma_reset") clearAlarm();
    else if (cmd == "alarma_off")   rSet(PIN_R_ALARM, false);
    else if (cmd == "manual")   { allOff(); sysState = ST_MANUAL;  autoMode = false; }
    else if (cmd == "standby")  { allOff(); sysState = ST_STANDBY; autoMode = false; }
    else if (cmd == "auto")     { if (sysState != ST_ALARM) sysState = ST_IDLE; }
    else if (cmd == "alim_on")  rSet(PIN_R_ALIM, true);
    else if (cmd == "alim_off") rSet(PIN_R_ALIM, false);
    else if (cmd == "hp_on")    rSet(PIN_R_HP,   true);
    else if (cmd == "hp_off")   rSet(PIN_R_HP,   false);
    else if (cmd == "sol_on")   rSet(PIN_R_SOL,  true);
    else if (cmd == "sol_off")  rSet(PIN_R_SOL,  false);
    else if (cmd == "uv_on")    rSet(PIN_R_UV,   true);
    else if (cmd == "uv_off")   rSet(PIN_R_UV,   false);
}

void setupWebServer() {
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin",  "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");

    server.onNotFound([](AsyncWebServerRequest* req) {
        if (req->method() == HTTP_OPTIONS) req->send(204);
        else req->send(404, "text/plain", "Not Found");
    });

    server.on("/api/status", HTTP_GET, [](AsyncWebServerRequest* req) {
        req->send(200, "application/json", buildStatusJson());
    });

    server.on("/api/command", HTTP_POST,
        [](AsyncWebServerRequest* req) {},
        nullptr,
        [](AsyncWebServerRequest* req, uint8_t* data, size_t len, size_t, size_t) {
            StaticJsonDocument<128> doc;
            if (deserializeJson(doc, data, len) || !doc.containsKey("cmd")) {
                req->send(400, "application/json", "{\"ok\":false}"); return;
            }
            handleWebCmd(doc["cmd"].as<String>());
            req->send(200, "application/json", "{\"ok\":true}");
        }
    );

    server.on("/api/alarms", HTTP_GET, [](AsyncWebServerRequest* req) {
        req->send(200, "application/json", readAlarmLogJson(20));
    });

    server.on("/api/schedule", HTTP_POST,
        [](AsyncWebServerRequest* req) {},
        nullptr,
        [](AsyncWebServerRequest* req, uint8_t* data, size_t len, size_t, size_t) {
            StaticJsonDocument<128> doc;
            if (deserializeJson(doc, data, len)) {
                req->send(400, "application/json", "{\"ok\":false}"); return;
            }
            if (doc.containsKey("enabled")) schedEnabled = doc["enabled"];
            if (doc.containsKey("onH"))     schedOnH     = doc["onH"];
            if (doc.containsKey("onM"))     schedOnM     = doc["onM"];
            if (doc.containsKey("offH"))    schedOffH    = doc["offH"];
            if (doc.containsKey("offM"))    schedOffM    = doc["offM"];
            saveSchedule();
            req->send(200, "application/json", "{\"ok\":true}");
        }
    );

    server.on("/api/reset_counter", HTTP_POST,
        [](AsyncWebServerRequest* req) {},
        nullptr,
        [](AsyncWebServerRequest* req, uint8_t* data, size_t len, size_t, size_t) {
            StaticJsonDocument<64> doc;
            if (deserializeJson(doc, data, len) || !doc.containsKey("counter")) {
                req->send(400, "application/json", "{\"ok\":false}"); return;
            }
            resetCounter(doc["counter"].as<String>());
            req->send(200, "application/json", "{\"ok\":true}");
        }
    );

    ws.onEvent([](AsyncWebSocket*, AsyncWebSocketClient* client,
                  AwsEventType type, void*, uint8_t*, size_t) {
        if (type == WS_EVT_CONNECT) client->text(buildStatusJson());
    });
    server.addHandler(&ws);
    server.begin();
    Serial.println("[WEB] API en http://" + WiFi.localIP().toString());
}

// ═══════════════════════════════════════════════════════
//  Setup
// ═══════════════════════════════════════════════════════
void setup() {
    Serial.begin(115200);
    Serial.println("\n[SYS] Purificadora de Agua — Iniciando");

    const uint8_t relayPins[] = {
        PIN_R_ALIM, PIN_R_HP, PIN_R_SOL,
        PIN_R_UV, PIN_R_LAV1, PIN_R_LAV2, PIN_R_LAV3, PIN_R_ALARM
    };
    for (uint8_t p : relayPins) { pinMode(p, OUTPUT); digitalWrite(p, RELAY_OFF); }

    pinMode(PIN_FL_CISTERNA, INPUT_PULLDOWN);
    pinMode(PIN_FL_TK_BAJO,  INPUT_PULLDOWN);
    pinMode(PIN_FL_TK_ALTO,  INPUT_PULLDOWN);

    if (!LittleFS.begin(true))
        Serial.println("[ERR] LittleFS mount failed");
    else
        Serial.println("[FS] LittleFS OK");

    loadPrefs();
    Serial.printf("[NVS] Membrana=%.1fh  UV=%.1fh\n",
        secMembrane / 3600.0f, secUV / 3600.0f);

    Wire.begin(OLED_SDA, OLED_SCL);
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
        Serial.println("[ERR] OLED no encontrado");
    } else {
        display.clearDisplay();
        display.setTextColor(SSD1306_WHITE);
        display.setTextSize(1);
        display.setCursor(18, 20); display.println("Purificadora H2O");
        display.setCursor(34, 34); display.println("Iniciando...");
        display.display();
    }

    Serial.printf("[NET] Conectando a %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    unsigned long wt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - wt < 20000UL) {
        delay(500); Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[NET] IP: " + WiFi.localIP().toString());
        configTime(TZ_OFFSET_SEC, 0, NTP_SERVER1, NTP_SERVER2);
        Serial.println("[NTP] Sincronizando hora...");
        setupWebServer();
    } else {
        Serial.println("\n[NET] WiFi timeout — modo offline");
    }

    tlsClient.setInsecure();

    // Eliminar webhook si estuviera activo (bloquea getUpdates)
    {
        WiFiClientSecure sc;
        sc.setInsecure();
        HTTPClient h;
        h.begin(sc, "https://api.telegram.org/bot" + String(BOT_TOKEN) + "/deleteWebhook");
        int r = h.GET();
        Serial.printf("[TG] deleteWebhook=%d\n", r);
        h.end();
        sc.stop();
    }

    bot.sendMessage(CHAT_ID,
        "🟢 *Purificadora online*\nIP: " + WiFi.localIP().toString() +
        "\nHora: " + getTimeStr() +
        "\nMembrana: " + String(secMembrane / 3600.0f, 1) + " h" +
        "\nUV: " + String(secUV / 3600.0f, 1) + " h" +
        "\nUsa /ayuda para ver los comandos.",
        "Markdown");

    Serial.println("[SYS] Setup completo");
}

// ═══════════════════════════════════════════════════════
//  Loop
// ═══════════════════════════════════════════════════════
void loop() {
    unsigned long now = millis();

    if (now - tLastSensor >= INTERVAL_SENSOR) {
        tLastSensor = now;
        readSensors();
    }

    checkSafety();

    switch (sysState) {
        case ST_PRIMING:   handlePriming();  break;
        case ST_PURIFYING: handleAutoFill(); break;
        case ST_WASHING:   handleWashing();  break;
        default: break;
    }

    if (now - tLastCounter >= INTERVAL_COUNTER) {
        tLastCounter = now;
        updateCounters();
    }

    if (now - tLastNvsSave >= INTERVAL_SAVE_NVS) {
        tLastNvsSave = now;
        saveCounters();
    }

    if (now - tLastSchedule >= INTERVAL_SCHEDULE) {
        tLastSchedule = now;
        checkSchedule();
    }

    if (now - tLastSupabase >= INTERVAL_SUPABASE) {
        tLastSupabase = now;
        pushToSupabase();
    }

    if (now - tLastCmdPoll >= 10000UL) {
        tLastCmdPoll = now;
        pollCommands();
    }

    if (now - tLastDisplay >= INTERVAL_DISPLAY) {
        tLastDisplay = now;
        updateDisplay();
    }

    if (now - tLastTelegram >= INTERVAL_TELEGRAM) {
        tLastTelegram = now;
        checkTelegram();
    }

    ws.cleanupClients();
    if (now - tLastWs >= INTERVAL_WS) {
        tLastWs = now;
        if (ws.count() > 0) ws.textAll(buildStatusJson());
    }
}

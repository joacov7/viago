#pragma once
#include "secrets.h"

// ──────────────────────────────────────────────
//  OLED SSD1306 0.96" via I2C
// ──────────────────────────────────────────────
#define OLED_SDA         21
#define OLED_SCL         22
#define OLED_ADDR        0x3C
#define SCREEN_W         128
#define SCREEN_H         64

// ──────────────────────────────────────────────
//  Relés  (módulo activo en LOW)
// ──────────────────────────────────────────────
#define RELAY_ON         LOW
#define RELAY_OFF        HIGH

#define PIN_R_ALIM       2    // Bomba alimentación
#define PIN_R_HP         4    // Bomba alta presión (RO)
#define PIN_R_SOL        5    // Solenoide llenadora
#define PIN_R_UV         16   // Lámpara UV
#define PIN_R_LAV1       17   // Lavadora etapa 1 – pre-enjuague
#define PIN_R_LAV2       18   // Lavadora etapa 2 – sanitizado
#define PIN_R_LAV3       19   // Lavadora etapa 3 – enjuague final
#define PIN_R_ALARM      23   // Alarma / buzzer

// ──────────────────────────────────────────────
//  Sensores
// ──────────────────────────────────────────────
#define PIN_TDS_IN       34   // TDS agua cruda  (ADC1)
#define PIN_TDS_OUT      35   // TDS agua purificada (ADC1)
#define PIN_PRESION      32   // Presión 4-20 mA → resistor 165Ω (ADC1)

// Flotantes: HIGH = agua presente
#define PIN_FL_CISTERNA  25   // Flotante cisterna fuente
#define PIN_FL_TK_BAJO   26   // Flotante nivel bajo tanque
#define PIN_FL_TK_ALTO   27   // Flotante nivel alto  tanque

// ──────────────────────────────────────────────
//  Calibración sensores
// ──────────────────────────────────────────────
#define WATER_TEMP_C     25.0f   // Temperatura referencia TDS

// Presión 4-20 mA con shunt 165Ω → 0.66 V – 3.30 V
#define PRES_V_MIN       0.66f
#define PRES_V_MAX       3.30f
#define PRES_BAR_MIN     0.0f
#define PRES_BAR_MAX     10.0f

// ──────────────────────────────────────────────
//  Umbrales de seguridad
// ──────────────────────────────────────────────
#define TDS_OUT_MAX_PPM   50     // TDS salida máximo aceptable
#define PRES_SAFE_MIN     1.5f  // Bar mínimo con bomba HP encendida
#define PRES_SAFE_MAX     8.5f  // Bar máximo antes de apagado de emergencia

// ──────────────────────────────────────────────
//  Tiempos de lavado de bidones (ms)
// ──────────────────────────────────────────────
#define T_LAV1_MS        60000UL   // Etapa 1: pre-enjuague
#define T_PAUSA_MS       10000UL   // Pausa entre etapas
#define T_LAV2_MS       120000UL   // Etapa 2: sanitizado
#define T_LAV3_MS        60000UL   // Etapa 3: enjuague final

// Retardo para confirmar tanque lleno antes de apagar
#define T_TANK_FULL_MS    5000UL

// Retardo bomba alimentación antes de arrancar HP
#define T_PRIME_MS        3000UL

// ──────────────────────────────────────────────
//  Intervalos de tarea (ms)
// ──────────────────────────────────────────────
#define INTERVAL_SENSOR   500UL
#define INTERVAL_DISPLAY  1000UL
#define INTERVAL_TELEGRAM 2000UL

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Vibration,
} from 'react-native';
import { DataService } from '../dataService';

const C = {
  bg: '#0f2142', card: 'rgba(255,255,255,0.08)',
  accent: '#38bdf8', text: '#fff', muted: '#93b4dd',
  danger: '#f87171', warning: '#fbbf24',
};

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, '⌫'];

export default function PinScreen({ navigation }) {
  const [pin, setPin]           = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError]       = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockSecs, setLockSecs] = useState(0);

  useEffect(() => {
    if (!lockSecs) return;
    const t = setInterval(() => {
      setLockSecs(s => { if (s <= 1) { clearInterval(t); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [lockSecs]);

  const locked = lockSecs > 0;

  const handleKey = async (key) => {
    if (checking || locked) return;
    if (key === '⌫') { setPin(p => p.slice(0, -1)); setError(false); return; }
    if (pin.length >= 4) return;

    const next = pin + String(key);
    setPin(next);
    setError(false);

    if (next.length === 4) {
      setChecking(true);
      try {
        const config = await DataService.getConfig();
        if (next === String(config.driverPin || '0000')) {
          setPin('');
          navigation.replace('Home');
        } else {
          Vibration.vibrate(300);
          const fails = failCount + 1;
          setFailCount(fails);
          if (fails >= 5) { setLockSecs(60); setFailCount(0); }
          setError(true);
          setPin('');
        }
      } catch {
        setError(true);
        setPin('');
      }
      setChecking(false);
    }
  };

  const statusColor = locked ? C.warning : error ? C.danger : C.muted;
  const statusText  = locked ? `Bloqueado ${lockSecs}s`
    : error    ? 'PIN incorrecto'
    : checking ? 'Verificando…'
    : 'Ingresá tu PIN';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.emoji}>📦</Text>
          <Text style={s.brand}>NATIVA</Text>
          <Text style={s.sub}>App del repartidor</Text>
        </View>

        <View style={s.card}>
          <Text style={[s.status, { color: statusColor }]}>{statusText}</Text>

          <View style={s.dots}>
            {[0,1,2,3].map(i => (
              <View key={i} style={[s.dot, {
                backgroundColor: error   ? 'rgba(248,113,113,0.5)'
                  : locked  ? 'rgba(251,191,36,0.4)'
                  : pin.length > i ? C.accent : 'rgba(255,255,255,0.2)',
              }]}/>
            ))}
          </View>

          <View style={s.keypad}>
            {KEYS.map((k, i) =>
              k === null
                ? <View key={i} style={s.keyEmpty}/>
                : <TouchableOpacity
                    key={i}
                    style={[s.key, (checking || locked) && s.keyDim]}
                    onPress={() => handleKey(k)}
                    activeOpacity={0.6}
                  >
                    <Text style={s.keyText}>{k}</Text>
                  </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header:    { alignItems: 'center', marginBottom: 40 },
  emoji:     { fontSize: 52 },
  brand:     { color: C.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginTop: 8 },
  sub:       { color: C.muted, fontSize: 14, marginTop: 4 },
  card:      { backgroundColor: C.card, borderRadius: 24, padding: 32, width: '100%', maxWidth: 300 },
  status:    { fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 22, letterSpacing: 2, textTransform: 'uppercase' },
  dots:      { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 32 },
  dot:       { width: 14, height: 14, borderRadius: 7 },
  keypad:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  key:       { width: '30%', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  keyDim:    { opacity: 0.4 },
  keyEmpty:  { width: '30%' },
  keyText:   { color: C.text, fontSize: 24, fontWeight: '600' },
});

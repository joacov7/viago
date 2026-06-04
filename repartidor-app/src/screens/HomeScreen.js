import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { DataService } from '../dataService';

const C = {
  bg: '#0f2142', card: 'rgba(255,255,255,0.08)',
  accent: '#38bdf8', text: '#fff', muted: '#93b4dd',
  success: '#4ade80', warning: '#fbbf24', danger: '#f87171',
};

const STATUS_COLOR = {
  pendiente: C.warning, 'en camino': C.accent,
  entregado: C.success,  cancelado: C.danger,
};

const STATUS_RANK = { pendiente: 0, 'en camino': 1, entregado: 2, cancelado: 3 };

export default function HomeScreen({ navigation }) {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [config, setConfig]       = useState(null);
  const locationSub = useRef(null);
  const date = DataService.today();

  const loadData = useCallback(async () => {
    const [allOrders, allClients, allZones] = await Promise.all([
      DataService.getOrdersByDate(date),
      DataService.getClients(),
      DataService.getZones(),
    ]);
    const clientMap = Object.fromEntries(allClients.map(c => [c.id, c]));
    const zoneMap   = Object.fromEntries(allZones.map(z => [z.id, z]));
    const enriched  = allOrders.map(o => {
      const client = clientMap[o.clientId] || {};
      return { ...o, client, zone: zoneMap[client.zoneId] || {} };
    });
    enriched.sort((a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9));
    setOrders(enriched);
  }, [date]);

  const startGps = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    setGpsActive(true);
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 100 },
      async ({ coords }) => {
        try { await DataService.upsertDriverLocation(coords.latitude, coords.longitude, 'Repartidor'); }
        catch { /* silent — don't interrupt the driver */ }
      }
    );
  }, []);

  useEffect(() => {
    (async () => {
      const cfg = await DataService.getConfig();
      setConfig(cfg);
      await loadData();
      setLoading(false);
      await startGps();
    })();
    return () => locationSub.current?.remove();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const logout = () => Alert.alert('Salir', '¿Cerrar sesión?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Salir', style: 'destructive', onPress: () => {
      locationSub.current?.remove();
      navigation.replace('Pin');
    }},
  ]);

  const pending   = orders.filter(o => o.status === 'pendiente').length;
  const delivered = orders.filter(o => o.status === 'entregado').length;

  if (loading) {
    return (
      <View style={[s.safe, s.center]}>
        <ActivityIndicator size="large" color={C.accent}/>
      </View>
    );
  }

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerDate} numberOfLines={1}>{today.charAt(0).toUpperCase() + today.slice(1)}</Text>
          <Text style={s.headerSub}>{config?.companyName || 'NATIVA'} · Reparto del día</Text>
        </View>
        <View style={s.headerRight}>
          <View style={[s.gpsDot, { backgroundColor: gpsActive ? C.success : 'rgba(255,255,255,0.3)' }]}/>
          <TouchableOpacity onPress={logout}>
            <Text style={s.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={[s.statNum, { color: C.warning }]}>{pending}</Text>
          <Text style={s.statLabel}>Pendientes</Text>
        </View>
        <View style={s.divider}/>
        <View style={s.stat}>
          <Text style={[s.statNum, { color: C.success }]}>{delivered}</Text>
          <Text style={s.statLabel}>Entregados</Text>
        </View>
        <View style={s.divider}/>
        <View style={s.stat}>
          <Text style={s.statNum}>{orders.length}</Text>
          <Text style={s.statLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => String(o.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent}/>}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No hay pedidos para hoy</Text>
          </View>
        }
        renderItem={({ item: o }) => {
          const color = STATUS_COLOR[o.status] || C.muted;
          const itemsText = (o.items || []).map(i => `${i.quantity}× ${i.productName}`).join(' · ') || 'Sin productos';
          return (
            <TouchableOpacity
              style={s.card}
              onPress={() => navigation.navigate('Order', { order: o })}
              activeOpacity={0.75}
            >
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.clientName}>{o.client?.name || '—'}</Text>
                  <Text style={s.clientAddr} numberOfLines={1}>{o.client?.address || 'Sin dirección'}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: color + '28' }]}>
                  <Text style={[s.badgeText, { color }]}>{o.status}</Text>
                </View>
              </View>
              <View style={s.cardBottom}>
                <Text style={s.itemsText} numberOfLines={1}>{itemsText}</Text>
                <Text style={s.totalText}>{DataService.formatCurrency(o.total)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  center:     { alignItems: 'center', justifyContent: 'center' },
  header:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  headerDate: { color: C.text, fontSize: 17, fontWeight: '700' },
  headerSub:  { color: C.muted, fontSize: 12, marginTop: 2 },
  headerRight:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  gpsDot:     { width: 8, height: 8, borderRadius: 4 },
  logoutText: { color: C.muted, fontSize: 13 },
  stats:      { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 8 },
  stat:       { flex: 1, alignItems: 'center' },
  statNum:    { color: C.text, fontSize: 26, fontWeight: '700' },
  statLabel:  { color: C.muted, fontSize: 11, marginTop: 2 },
  divider:    { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  list:       { padding: 16, paddingTop: 8, gap: 10 },
  card:       { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 14 },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  clientName: { color: C.text, fontSize: 15, fontWeight: '600' },
  clientAddr: { color: C.muted, fontSize: 12, marginTop: 2 },
  badge:      { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText:  { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemsText:  { color: C.muted, fontSize: 12, flex: 1, marginRight: 8 },
  totalText:  { color: C.accent, fontSize: 15, fontWeight: '700' },
  empty:      { padding: 40, alignItems: 'center' },
  emptyText:  { color: C.muted, fontSize: 14 },
});

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Linking, Alert,
} from 'react-native';
import CobroModal from '../components/CobroModal';
import { DataService } from '../dataService';

const C = {
  bg: '#0f2142', card: 'rgba(255,255,255,0.08)',
  accent: '#38bdf8', text: '#fff', muted: '#93b4dd',
  success: '#4ade80', warning: '#fbbf24', danger: '#f87171',
};

const STATUS_OPTS = [
  { key: 'pendiente',  label: 'Pendiente',  color: C.warning },
  { key: 'en camino',  label: 'En camino',  color: C.accent  },
  { key: 'entregado',  label: 'Entregado',  color: C.success },
];

export default function OrderScreen({ route, navigation }) {
  const [order, setOrder]         = useState(route.params.order);
  const [updating, setUpdating]   = useState(false);
  const [showCobro, setShowCobro] = useState(false);

  const handleStatus = async (status) => {
    if (updating || order.status === status) return;
    setUpdating(true);
    try {
      await DataService.updateOrder(order.id, { status });
      setOrder(o => ({ ...o, status }));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setUpdating(false);
  };

  const openMaps = () => {
    const addr = [order.client?.address, order.client?.city || 'Gualeguay, Entre Ríos']
      .filter(Boolean).join(', ');
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir el mapa'));
  };

  const openWhatsApp = () => {
    const phone = (order.client?.phone || '').replace(/\D/g, '');
    if (!phone) { Alert.alert('Sin teléfono', 'El cliente no tiene teléfono registrado'); return; }
    const msg = encodeURIComponent(
      `¡Hola ${order.client?.name}! 🚚 Estoy llegando a tu domicilio. NATIVA 💧`
    );
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  };

  const items   = order.items || [];
  const isPaid  = order.status === 'entregado';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>

        {/* Client */}
        <View style={s.card}>
          <Text style={s.clientName}>{order.client?.name || '—'}</Text>
          {order.client?.phone && <Text style={s.meta}>{order.client.phone}</Text>}
          {order.client?.address && <Text style={s.meta}>📍 {order.client.address}{order.client?.city ? `, ${order.client.city}` : ''}</Text>}
          {order.zone?.name && <Text style={s.zone}>{order.zone.name}</Text>}
        </View>

        {/* Items */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Productos</Text>
          {items.length === 0
            ? <Text style={s.muted}>Sin productos</Text>
            : items.map((item, i) => (
                <View key={i} style={s.itemRow}>
                  <Text style={s.itemName}>{item.quantity}× {item.productName}</Text>
                  <Text style={s.itemPrice}>{DataService.formatCurrency(item.subtotal)}</Text>
                </View>
              ))
          }
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>{DataService.formatCurrency(order.total)}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Estado</Text>
          <View style={s.statusRow}>
            {STATUS_OPTS.map(opt => {
              const active = order.status === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[s.statusBtn, active && { backgroundColor: opt.color + '28', borderColor: opt.color }]}
                  onPress={() => handleStatus(opt.key)}
                  disabled={updating}
                  activeOpacity={0.7}
                >
                  <Text style={[s.statusBtnText, { color: active ? opt.color : C.muted }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={openMaps} activeOpacity={0.7}>
            <Text style={s.actionText}>🗺️  Cómo llegar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={openWhatsApp} activeOpacity={0.7}>
            <Text style={s.actionText}>💬  WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Cobrar */}
        {!isPaid && (
          <TouchableOpacity style={s.cobroBtn} onPress={() => setShowCobro(true)} activeOpacity={0.8}>
            <Text style={s.cobroText}>Cobrar y entregar</Text>
          </TouchableOpacity>
        )}

        {isPaid && (
          <View style={s.paidBadge}>
            <Text style={s.paidText}>✓ Entregado y cobrado</Text>
          </View>
        )}
      </ScrollView>

      <CobroModal
        visible={showCobro}
        order={order}
        onClose={() => setShowCobro(false)}
        onDone={() => {
          setShowCobro(false);
          setOrder(o => ({ ...o, status: 'entregado' }));
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  scroll:       { padding: 16, paddingBottom: 48 },
  back:         { marginBottom: 12 },
  backText:     { color: C.accent, fontSize: 15 },
  card:         { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 12 },
  clientName:   { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  meta:         { color: C.muted, fontSize: 13, marginTop: 3 },
  zone:         { marginTop: 8, color: C.accent, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionLabel: { color: C.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  muted:        { color: C.muted, fontSize: 13 },
  itemRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemName:     { color: C.text, fontSize: 14 },
  itemPrice:    { color: C.muted, fontSize: 14 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.15)' },
  totalLabel:   { color: C.text, fontSize: 15, fontWeight: '600' },
  totalValue:   { color: C.accent, fontSize: 18, fontWeight: '700' },
  statusRow:    { flexDirection: 'row', gap: 8 },
  statusBtn:    { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  statusBtnText:{ fontSize: 12, fontWeight: '600' },
  actions:      { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  actionText:   { color: C.text, fontSize: 14 },
  cobroBtn:     { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 17, alignItems: 'center' },
  cobroText:    { color: '#0f2142', fontSize: 16, fontWeight: '700' },
  paidBadge:    { backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 14, paddingVertical: 17, alignItems: 'center' },
  paidText:     { color: C.success, fontSize: 15, fontWeight: '600' },
});

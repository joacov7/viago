import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { DataService } from '../dataService';

const C = {
  surface: '#162d55', accent: '#38bdf8',
  text: '#fff', muted: '#93b4dd',
};

const METHODS = [
  { key: 'efectivo',      label: 'Efectivo' },
  { key: 'transferencia', label: 'Transferencia' },
  { key: 'mercadopago',   label: 'MercadoPago' },
];

export default function CobroModal({ visible, order, onClose, onDone }) {
  const [method, setMethod] = useState('efectivo');
  const [saving, setSaving] = useState(false);

  if (!order) return null;

  const handleCobrar = async () => {
    setSaving(true);
    try {
      await DataService.createInvoice({
        orderId:       order.id,
        clientId:      order.clientId,
        total:         order.total,
        paymentMethod: method,
        items:         order.items || [],
      });
      await DataService.updateOrder(order.id, { status: 'entregado' });
      onDone();
    } catch (e) {
      Alert.alert('Error al cobrar', e.message);
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.handle}/>

          <Text style={s.title}>Cobrar pedido</Text>

          <View style={s.totalBox}>
            <Text style={s.totalLabel}>Total a cobrar</Text>
            <Text style={s.totalAmt}>{DataService.formatCurrency(order.total)}</Text>
            <Text style={s.clientLabel}>{order.client?.name || ''}</Text>
          </View>

          <Text style={s.sectionLabel}>Forma de pago</Text>
          <View style={s.methods}>
            {METHODS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[s.methodBtn, method === m.key && s.methodBtnActive]}
                onPress={() => setMethod(m.key)}
                activeOpacity={0.7}
              >
                <Text style={[s.methodText, method === m.key && s.methodTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.confirmBtn, saving && { opacity: 0.6 }]}
            onPress={handleCobrar}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#0f2142"/>
              : <Text style={s.confirmText}>Confirmar cobro y entregar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:          { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:             { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44 },
  handle:            { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:             { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  totalBox:          { backgroundColor: 'rgba(56,189,248,0.1)', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20 },
  totalLabel:        { color: C.muted, fontSize: 12, marginBottom: 4 },
  totalAmt:          { color: C.accent, fontSize: 32, fontWeight: '700' },
  clientLabel:       { color: C.muted, fontSize: 13, marginTop: 4 },
  sectionLabel:      { color: C.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  methods:           { flexDirection: 'row', gap: 8, marginBottom: 20 },
  methodBtn:         { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  methodBtnActive:   { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: C.accent },
  methodText:        { color: C.muted, fontSize: 13 },
  methodTextActive:  { color: C.accent, fontWeight: '600' },
  confirmBtn:        { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  confirmText:       { color: '#0f2142', fontSize: 16, fontWeight: '700' },
  cancelBtn:         { paddingVertical: 12, alignItems: 'center' },
  cancelText:        { color: C.muted, fontSize: 14 },
});

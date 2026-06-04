import { supabase } from './supabase';

const js = (row) => {
  if (!row) return null;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
};
const jsMany = (rows) => (rows || []).map(js);
const db = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k.replace(/([A-Z])/g, '_$1').toLowerCase()] = v;
  }
  return out;
};

let _cfg = null;

export const DataService = {
  today: () => new Date().toISOString().split('T')[0],

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(amount || 0);
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  },

  async getConfig() {
    if (_cfg) return _cfg;
    const { data } = await supabase.from('config').select('*').eq('id', 1).single();
    _cfg = data ? js(data) : { companyName: 'NATIVA', driverPin: '0000' };
    return _cfg;
  },

  async getOrdersByDate(date) {
    const { data } = await supabase.from('orders').select('*').eq('delivery_date', date);
    return jsMany(data);
  },

  async getClients() {
    const { data } = await supabase.from('clients').select('id,name,phone,address,city,zone_id').eq('active', true).limit(5000);
    return jsMany(data);
  },

  async getZones() {
    const { data } = await supabase.from('zones').select('*').order('id');
    return jsMany(data);
  },

  async getInvoicesByDate(date) {
    const { data } = await supabase.from('invoices').select('*')
      .gte('created_at', date + 'T00:00:00')
      .lte('created_at', date + 'T23:59:59');
    return jsMany(data);
  },

  async updateOrder(id, orderData) {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...db(orderData), updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return js(data);
  },

  async createInvoice(invoiceData) {
    const { data: num } = await supabase.rpc('next_invoice_number');
    const { data, error } = await supabase.from('invoices').insert(db({
      number: num || `FAC-${Date.now()}`,
      orderId: invoiceData.orderId || null,
      clientId: parseInt(invoiceData.clientId),
      total: parseFloat(invoiceData.total) || 0,
      paymentMethod: invoiceData.paymentMethod || 'efectivo',
      paymentStatus: 'pagado',
      paidAt: new Date().toISOString(),
      notes: invoiceData.notes || '',
      items: invoiceData.items || [],
    })).select().single();
    if (error) throw new Error(error.message);
    return js(data);
  },

  async upsertDriverLocation(lat, lng, driverName) {
    await supabase.from('driver_locations').upsert(
      { id: 1, lat, lng, driver_name: driverName, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  },
};

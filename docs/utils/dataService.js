// NATIVA - Data Service: all localStorage CRUD operations, code generation, analytics, and seed data.

const DataService = {
  KEYS: {
    clients: 'nativa_clients',
    orders: 'nativa_orders',
    zones: 'nativa_zones',
    products: 'nativa_products',
    invoices: 'nativa_invoices',
    config: 'nativa_config',
    pointsHistory: 'nativa_points_history',
    promotions: 'nativa_promotions',
    seeded: 'nativa_seeded',
  },

  _get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  },
  _set(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error('Storage error:', e); }
  },
  _nextId(items) {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map(i => i.id)) + 1;
  },

  // ─── CONFIG ──────────────────────────────────────────────────────────────
  getConfig() {
    return this._get(this.KEYS.config) || {
      companyName: 'NATIVA',
      tagline: 'Agua que llega. Siempre.',
      phone: '',
      email: '',
      address: '',
      city: '',
      primaryColor: '#2563EB',
      pointsPerOrder: 10,
      pointsForReward: 100,
      freeProductId: 1,
      referralBonus: 50,
      mpPublicKey: '',
      whatsappNumber: '',
      paymentMethods: ['efectivo', 'transferencia', 'mercadopago'],
    };
  },
  saveConfig(config) { this._set(this.KEYS.config, config); },

  // ─── ZONES ───────────────────────────────────────────────────────────────
  getZones() { return this._get(this.KEYS.zones) || []; },
  getZone(id) { return this.getZones().find(z => z.id == id); },
  createZone(data) {
    const zones = this.getZones();
    const zone = { id: this._nextId(zones), name: data.name, color: data.color || '#3B82F6', deliveryDays: data.deliveryDays || [], createdAt: new Date().toISOString() };
    zones.push(zone); this._set(this.KEYS.zones, zones); return zone;
  },
  updateZone(id, data) {
    const zones = this.getZones(); const idx = zones.findIndex(z => z.id == id);
    if (idx >= 0) { zones[idx] = { ...zones[idx], ...data }; this._set(this.KEYS.zones, zones); }
    return zones[idx];
  },
  deleteZone(id) { this._set(this.KEYS.zones, this.getZones().filter(z => z.id != id)); },

  // ─── PRODUCTS ────────────────────────────────────────────────────────────
  getProducts(includeInactive = false) {
    const p = this._get(this.KEYS.products) || [];
    return includeInactive ? p : p.filter(x => x.active);
  },
  getProduct(id) { return (this._get(this.KEYS.products) || []).find(p => p.id == id); },
  createProduct(data) {
    const products = this._get(this.KEYS.products) || [];
    const product = { id: this._nextId(products), name: data.name, type: data.type || 'bidon', price: parseFloat(data.price) || 0, unit: data.unit || 'unidad', active: true, createdAt: new Date().toISOString() };
    products.push(product); this._set(this.KEYS.products, products); return product;
  },
  updateProduct(id, data) {
    const products = this._get(this.KEYS.products) || []; const idx = products.findIndex(p => p.id == id);
    if (idx >= 0) { products[idx] = { ...products[idx], ...data }; this._set(this.KEYS.products, products); }
    return products[idx];
  },

  // ─── CLIENTS ─────────────────────────────────────────────────────────────
  _genClientCode() {
    const clients = this._get(this.KEYS.clients) || [];
    const maxNum = clients.reduce((max, c) => Math.max(max, parseInt(c.code?.replace('NAT-', '') || '0')), 0);
    return `NAT-${String(maxNum + 1).padStart(3, '0')}`;
  },
  _genReferralCode(code) { return code.replace('NAT-', '') + '-REF'; },
  getClients(includeInactive = false) {
    const c = this._get(this.KEYS.clients) || [];
    return includeInactive ? c : c.filter(x => x.active);
  },
  getClient(id) { return (this._get(this.KEYS.clients) || []).find(c => c.id == id); },
  getClientByReferral(code) { return (this._get(this.KEYS.clients) || []).find(c => c.referralCode === code); },
  createClient(data) {
    const clients = this._get(this.KEYS.clients) || [];
    const code = this._genClientCode();
    const client = {
      id: this._nextId(clients), code, name: data.name, address: data.address || '',
      phone: data.phone || '', email: data.email || '', zoneId: data.zoneId ? parseInt(data.zoneId) : null,
      type: data.type || 'hogar', frequency: data.frequency || 'semanal',
      deliveryDay: data.deliveryDay || '', points: 0, referralCode: this._genReferralCode(code),
      referredBy: data.referredBy || null, active: true, notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };
    clients.push(client); this._set(this.KEYS.clients, clients);
    if (data.referredBy) this.addPoints(data.referredBy, this.getConfig().referralBonus, 'referral', 'Nuevo referido registrado');
    return client;
  },
  updateClient(id, data) {
    const clients = this._get(this.KEYS.clients) || []; const idx = clients.findIndex(c => c.id == id);
    if (idx >= 0) { clients[idx] = { ...clients[idx], ...data, id: clients[idx].id, code: clients[idx].code, referralCode: clients[idx].referralCode }; this._set(this.KEYS.clients, clients); }
    return clients[idx];
  },
  deleteClient(id) {
    const clients = this._get(this.KEYS.clients) || []; const idx = clients.findIndex(c => c.id == id);
    if (idx >= 0) { clients[idx].active = false; this._set(this.KEYS.clients, clients); }
  },

  // ─── ORDERS ──────────────────────────────────────────────────────────────
  getOrders() { return this._get(this.KEYS.orders) || []; },
  getOrder(id) { return this.getOrders().find(o => o.id == id); },
  getClientOrders(clientId) { return this.getOrders().filter(o => o.clientId == clientId); },
  getTodayOrders() {
    const today = new Date().toISOString().split('T')[0];
    return this.getOrders().filter(o => o.deliveryDate === today);
  },
  getOrdersByDate(date) { return this.getOrders().filter(o => o.deliveryDate === date); },
  createOrder(data) {
    const orders = this.getOrders();
    const order = {
      id: this._nextId(orders), clientId: parseInt(data.clientId), status: 'pendiente',
      items: data.items || [], total: parseFloat(data.total) || 0,
      deliveryDate: data.deliveryDate || new Date().toISOString().split('T')[0],
      notes: data.notes || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    orders.push(order); this._set(this.KEYS.orders, orders); return order;
  },
  updateOrder(id, data) {
    const orders = this.getOrders(); const idx = orders.findIndex(o => o.id == id);
    if (idx >= 0) {
      const wasDelivered = orders[idx].status !== 'entregado' && data.status === 'entregado';
      orders[idx] = { ...orders[idx], ...data, id: orders[idx].id, updatedAt: new Date().toISOString() };
      this._set(this.KEYS.orders, orders);
      if (wasDelivered) {
        const cfg = this.getConfig();
        this.addPoints(orders[idx].clientId, cfg.pointsPerOrder, 'earned', `Pedido #${id} entregado`);
      }
    }
    return orders[idx];
  },
  deleteOrder(id) {
    const orders = this.getOrders(); const idx = orders.findIndex(o => o.id == id);
    if (idx >= 0) { orders[idx].status = 'cancelado'; this._set(this.KEYS.orders, orders); }
  },

  // ─── INVOICES ────────────────────────────────────────────────────────────
  _genInvoiceNumber() {
    const invs = this._get(this.KEYS.invoices) || [];
    const maxNum = invs.reduce((max, i) => Math.max(max, parseInt(i.number?.replace('FAC-', '') || '0')), 0);
    return `FAC-${String(maxNum + 1).padStart(4, '0')}`;
  },
  getInvoices() { return this._get(this.KEYS.invoices) || []; },
  getInvoice(id) { return this.getInvoices().find(i => i.id == id); },
  getClientInvoices(clientId) { return this.getInvoices().filter(i => i.clientId == clientId); },
  createInvoice(data) {
    const invoices = this.getInvoices();
    const invoice = {
      id: this._nextId(invoices), number: this._genInvoiceNumber(), orderId: data.orderId || null,
      clientId: parseInt(data.clientId), total: parseFloat(data.total) || 0,
      paymentMethod: data.paymentMethod || 'efectivo', paymentStatus: data.paymentStatus || 'pendiente',
      mpPaymentId: null, mpPaymentLink: null, paidAt: null,
      notes: data.notes || '', items: data.items || [], createdAt: new Date().toISOString(),
    };
    invoices.push(invoice); this._set(this.KEYS.invoices, invoices); return invoice;
  },
  updateInvoice(id, data) {
    const invoices = this.getInvoices(); const idx = invoices.findIndex(i => i.id == id);
    if (idx >= 0) {
      if (data.paymentStatus === 'pagado' && !invoices[idx].paidAt) data.paidAt = new Date().toISOString();
      invoices[idx] = { ...invoices[idx], ...data };
      this._set(this.KEYS.invoices, invoices);
    }
    return invoices[idx];
  },

  // ─── LOYALTY ─────────────────────────────────────────────────────────────
  getPointsHistory(clientId = null) {
    const h = this._get(this.KEYS.pointsHistory) || [];
    return clientId ? h.filter(x => x.clientId == clientId) : h;
  },
  addPoints(clientId, points, action, description) {
    const clients = this._get(this.KEYS.clients) || []; const idx = clients.findIndex(c => c.id == clientId);
    if (idx >= 0) {
      clients[idx].points = (clients[idx].points || 0) + points;
      this._set(this.KEYS.clients, clients);
      const history = this._get(this.KEYS.pointsHistory) || [];
      history.push({ id: this._nextId(history), clientId: parseInt(clientId), points, action, description, createdAt: new Date().toISOString() });
      this._set(this.KEYS.pointsHistory, history);
    }
  },
  redeemPoints(clientId, points, description) {
    const clients = this._get(this.KEYS.clients) || []; const idx = clients.findIndex(c => c.id == clientId);
    if (idx >= 0 && clients[idx].points >= points) {
      clients[idx].points -= points; this._set(this.KEYS.clients, clients);
      const history = this._get(this.KEYS.pointsHistory) || [];
      history.push({ id: this._nextId(history), clientId: parseInt(clientId), points: -points, action: 'redeemed', description, createdAt: new Date().toISOString() });
      this._set(this.KEYS.pointsHistory, history); return true;
    }
    return false;
  },

  // ─── PROMOTIONS ──────────────────────────────────────────────────────────
  getPromotions() { return this._get(this.KEYS.promotions) || []; },
  createPromotion(data) {
    const promotions = this.getPromotions();
    const promo = { id: this._nextId(promotions), name: data.name, type: data.type || 'primera_compra', discountType: data.discountType || 'porcentaje', discountValue: parseFloat(data.discountValue) || 0, zoneId: data.zoneId || null, minQuantity: parseInt(data.minQuantity) || 0, active: true, createdAt: new Date().toISOString() };
    promotions.push(promo); this._set(this.KEYS.promotions, promotions); return promo;
  },
  updatePromotion(id, data) {
    const promotions = this.getPromotions(); const idx = promotions.findIndex(p => p.id == id);
    if (idx >= 0) { promotions[idx] = { ...promotions[idx], ...data }; this._set(this.KEYS.promotions, promotions); }
  },
  deletePromotion(id) { this._set(this.KEYS.promotions, this.getPromotions().filter(p => p.id != id)); },

  // ─── ANALYTICS ───────────────────────────────────────────────────────────
  getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7);
    const orders = this.getOrders();
    const clients = this.getClients();
    const invoices = this.getInvoices();

    const todayOrders = orders.filter(o => o.deliveryDate === today);
    const monthOrders = orders.filter(o => o.deliveryDate.startsWith(monthStart));
    const todayRevenue = invoices.filter(i => i.createdAt.startsWith(today) && i.paymentStatus === 'pagado').reduce((s, i) => s + i.total, 0);
    const monthRevenue = invoices.filter(i => i.createdAt.startsWith(monthStart) && i.paymentStatus === 'pagado').reduce((s, i) => s + i.total, 0);
    const pendingPayments = invoices.filter(i => i.paymentStatus === 'pendiente').reduce((s, i) => s + i.total, 0);

    const weekData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayRevenue = invoices.filter(inv => inv.createdAt.startsWith(dateStr) && inv.paymentStatus === 'pagado').reduce((s, inv) => s + inv.total, 0);
      return { date: dateStr, day: d.toLocaleDateString('es-AR', { weekday: 'short' }), orders: orders.filter(o => o.deliveryDate === dateStr && o.status === 'entregado').length, revenue: dayRevenue };
    });

    return {
      totalClients: clients.length,
      newClientsThisMonth: clients.filter(c => c.createdAt.startsWith(monthStart)).length,
      todayOrdersCount: todayOrders.length,
      todayPendingCount: todayOrders.filter(o => o.status === 'pendiente').length,
      todayDeliveredCount: todayOrders.filter(o => o.status === 'entregado').length,
      todayRevenue, monthRevenue, monthOrdersCount: monthOrders.length, pendingPayments, weekData,
    };
  },

  // ─── SEED DATA ────────────────────────────────────────────────────────────
  isSeeded() { return this._get(this.KEYS.seeded) === true; },
  resetData() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  },
  seedData() {
    if (this.isSeeded()) return;

    this.saveConfig({
      companyName: 'NATIVA', tagline: 'Agua que llega. Siempre.',
      phone: '+54 9 11 2345-6789', email: 'info@nativaagua.com.ar',
      address: 'Av. Principal 456, Buenos Aires', primaryColor: '#2563EB',
      pointsPerOrder: 10, pointsForReward: 100, freeProductId: 1, referralBonus: 50,
      mpPublicKey: '', whatsappNumber: '5491123456789',
      paymentMethods: ['efectivo', 'transferencia', 'mercadopago'],
    });

    [
      { name: 'Centro', color: '#3B82F6', deliveryDays: ['lunes', 'miercoles', 'viernes'] },
      { name: 'Barrio Norte', color: '#10B981', deliveryDays: ['martes', 'jueves'] },
      { name: 'Barrio Sur', color: '#F59E0B', deliveryDays: ['lunes', 'jueves'] },
      { name: 'Zona Industrial', color: '#8B5CF6', deliveryDays: ['miercoles'] },
      { name: 'Pueblos', color: '#EC4899', deliveryDays: ['viernes'] },
    ].forEach(z => this.createZone(z));

    [
      { name: 'Bidón 20L', type: 'bidon', price: 1500, unit: 'unidad' },
      { name: 'Bidón 12L', type: 'bidon', price: 900, unit: 'unidad' },
      { name: 'Bidón 20L Premium', type: 'bidon', price: 1800, unit: 'unidad' },
      { name: 'Botella 2.25L', type: 'botella', price: 180, unit: 'unidad' },
      { name: 'Dispensador Eléctrico', type: 'accesorio', price: 8500, unit: 'unidad' },
    ].forEach(p => this.createProduct(p));

    const clientsData = [
      { name: 'María González', address: 'Mitre 234', phone: '1123456780', zoneId: 1, type: 'hogar', frequency: 'semanal', deliveryDay: 'lunes' },
      { name: 'Carlos Rodríguez', address: 'San Martín 567', phone: '1187654321', zoneId: 1, type: 'comercio', frequency: 'quincenal', deliveryDay: 'miercoles' },
      { name: 'Ana Martínez', address: 'Belgrano 890', phone: '1134567812', zoneId: 2, type: 'hogar', frequency: 'semanal', deliveryDay: 'martes' },
      { name: 'Luis Fernández', address: 'Rivadavia 123', phone: '1145678923', zoneId: 2, type: 'hogar', frequency: 'semanal', deliveryDay: 'martes' },
      { name: 'Supermercado La Estrella', address: 'Corrientes 456', phone: '1156789034', zoneId: 1, type: 'comercio', frequency: 'semanal', deliveryDay: 'lunes' },
      { name: 'Patricia López', address: 'Sarmiento 789', phone: '1167890145', zoneId: 3, type: 'hogar', frequency: 'quincenal', deliveryDay: 'lunes' },
      { name: 'Diego Pérez', address: 'Lavalle 234', phone: '1178901256', zoneId: 3, type: 'hogar', frequency: 'ocasional', deliveryDay: 'jueves' },
      { name: 'Empresa TechSol', address: 'Parque Industrial Lote 45', phone: '1189012367', zoneId: 4, type: 'comercio', frequency: 'semanal', deliveryDay: 'miercoles' },
      { name: 'Rosa Díaz', address: 'General Paz 678', phone: '1190123478', zoneId: 2, type: 'hogar', frequency: 'semanal', deliveryDay: 'jueves' },
      { name: 'Buffet Municipal', address: 'Plaza Central s/n', phone: '1101234589', zoneId: 1, type: 'comercio', frequency: 'semanal', deliveryDay: 'viernes' },
      { name: 'Jorge Sánchez', address: 'Camino Rural Km 5', phone: '1112345690', zoneId: 5, type: 'hogar', frequency: 'quincenal', deliveryDay: 'viernes' },
      { name: 'Elena Torres', address: 'Reconquista 321', phone: '1123456701', zoneId: 1, type: 'hogar', frequency: 'semanal', deliveryDay: 'miercoles' },
      { name: 'Clínica San José', address: 'Av. Mitre 1200', phone: '1134567812', zoneId: 2, type: 'comercio', frequency: 'semanal', deliveryDay: 'martes' },
      { name: 'Sebastián Ruiz', address: 'Darwin 456', phone: '1145678923', zoneId: 3, type: 'hogar', frequency: 'ocasional', deliveryDay: 'jueves' },
      { name: 'Sandra Morales', address: 'Chacabuco 789', phone: '1156789034', zoneId: 4, type: 'comercio', frequency: 'quincenal', deliveryDay: 'miercoles' },
    ];
    clientsData.forEach(c => this.createClient(c));

    const clients = this.getClients();
    const prods = this.getProducts();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const makeItems = (count = 1) => {
      const items = [];
      let total = 0;
      for (let i = 0; i < count; i++) {
        const p = prods[Math.floor(Math.random() * Math.min(prods.length, 4))];
        const qty = Math.floor(Math.random() * 3) + 1;
        const sub = p.price * qty;
        items.push({ productId: p.id, productName: p.name, quantity: qty, price: p.price, subtotal: sub });
        total += sub;
      }
      return { items, total };
    };

    // Today's orders
    clients.slice(0, 8).forEach((c, i) => {
      const { items, total } = makeItems(i % 3 === 0 ? 2 : 1);
      const order = this.createOrder({ clientId: c.id, items, total, deliveryDate: todayStr });
      if (i < 3) this.updateOrder(order.id, { status: 'entregado' });
    });

    // Past 6 days
    for (let day = 1; day <= 6; day++) {
      const d = new Date(today); d.setDate(d.getDate() - day);
      const dateStr = d.toISOString().split('T')[0];
      const shuffled = [...clients].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 5) + 3);
      shuffled.forEach(c => {
        const { items, total } = makeItems(Math.floor(Math.random() * 2) + 1);
        const order = this.createOrder({ clientId: c.id, items, total, deliveryDate: dateStr });
        this.updateOrder(order.id, { status: day > 1 ? 'entregado' : (Math.random() > 0.3 ? 'entregado' : 'pendiente') });
      });
    }

    // Invoices for delivered orders
    const methods = ['efectivo', 'transferencia', 'mercadopago'];
    this.getOrders().filter(o => o.status === 'entregado').forEach((o, i) => {
      const client = this.getClient(o.clientId); if (!client) return;
      const inv = this.createInvoice({ orderId: o.id, clientId: o.clientId, total: o.total, paymentMethod: methods[i % 3], items: o.items });
      if (i % 5 !== 0) this.updateInvoice(inv.id, { paymentStatus: 'pagado' });
    });

    // Loyalty points
    clients.forEach(c => { const pts = Math.floor(Math.random() * 80); if (pts > 0) this.addPoints(c.id, pts, 'earned', 'Puntos históricos'); });

    // Promotions
    [
      { name: 'Primera Compra -10%', type: 'primera_compra', discountType: 'porcentaje', discountValue: 10 },
      { name: '3 Bidones = 1 Gratis', type: 'volumen', discountType: 'producto_gratis', discountValue: 1, minQuantity: 3 },
      { name: 'Descuento Zona Industrial', type: 'zona', discountType: 'porcentaje', discountValue: 5, zoneId: 4 },
    ].forEach(p => this.createPromotion(p));

    this._set(this.KEYS.seeded, true);
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount || 0);
  },
  formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },
  formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  today() { return new Date().toISOString().split('T')[0]; },
};

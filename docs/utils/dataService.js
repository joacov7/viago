// NATIVA - Data Service: async Supabase CRUD, code generation, analytics

const DataService = {
  _sb: SupabaseDB,

  // snake_case DB row → camelCase JS object
  _js(row) {
    if (!row) return null;
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      out[camel] = v;
    }
    return out;
  },
  _jsMany(rows) { return (rows || []).map(r => this._js(r)); },

  // camelCase JS object → snake_case DB row (strip undefined)
  _db(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      const snake = k.replace(/([A-Z])/g, '_$1').toLowerCase();
      out[snake] = v;
    }
    return out;
  },

  // Sync version using cache (for non-async contexts like WhatsApp/Geo utils)
  getConfigSync() {
    return this._configCache || this._defaultConfig();
  },

  // ─── CONFIG ──────────────────────────────────────────────────────────────
  _configCache: null,
  async getConfig() {
    if (this._configCache) return this._configCache;
    const { data } = await this._sb.from('config').select('*').eq('id', 1).single();
    this._configCache = data ? this._js(data) : this._defaultConfig();
    return this._configCache;
  },
  async saveConfig(config) {
    this._configCache = config;
    const clean = Object.fromEntries(Object.entries(config).filter(([k]) => !k.startsWith('_')));
    const dbData = this._db(clean);
    dbData.id = 1;
    const { error } = await this._sb.from('config').upsert(dbData);
    if (error) throw new Error(error.message);
  },
  _defaultConfig() {
    return {
      companyName: 'NATIVA', tagline: 'Agua que llega. Siempre.',
      phone: '', email: '', address: '', city: '', primaryColor: '#2563EB',
      clientHeroImage: '',
      pointsPerOrder: 10, pointsForReward: 100, freeProductId: 1, referralBonus: 50,
      referralsEnabled: false, referralReferrerReward: 500, referralReferredDiscount: 10,
      referralMessage: 'Referí a un amigo y ambos ganan crédito en su cuenta.',
      referralShareMessage: 'Hola! Te recomiendo el agua de {empresa} 💧\nMe tienen re bien surtido. Entrá acá y dejá tus datos: {link}\n¡Los dos ganamos crédito! 🎁',
      referralPrizeEvery: 0, referralPrizePts: 200,
      mpPublicKey: '', whatsappNumber: '',
      paymentMethods: ['efectivo', 'transferencia', 'mercadopago'],
      storeEnabled: false, pointsConversionRate: 1,
    };
  },

  // ─── ZONES ───────────────────────────────────────────────────────────────
  async getZones() {
    const { data } = await this._sb.from('zones').select('*').order('id');
    return this._jsMany(data);
  },
  async getZone(id) {
    const { data } = await this._sb.from('zones').select('*').eq('id', id).single();
    return this._js(data);
  },
  async createZone(zoneData) {
    const { data } = await this._sb.from('zones')
      .insert(this._db({ name: zoneData.name, color: zoneData.color || '#3B82F6', deliveryDays: zoneData.deliveryDays || [] }))
      .select().single();
    return this._js(data);
  },
  async updateZone(id, zoneData) {
    const { data } = await this._sb.from('zones').update(this._db(zoneData)).eq('id', id).select().single();
    return this._js(data);
  },
  async deleteZone(id) {
    await this._sb.from('zones').delete().eq('id', id);
  },

  // ─── PRODUCTS ────────────────────────────────────────────────────────────
  async getProducts(includeInactive = false) {
    let q = this._sb.from('products').select('*').order('id');
    if (!includeInactive) q = q.eq('active', true);
    const { data } = await q;
    return this._jsMany(data);
  },
  async getProduct(id) {
    const { data } = await this._sb.from('products').select('*').eq('id', id).single();
    return this._js(data);
  },
  async createProduct(productData) {
    const { data } = await this._sb.from('products')
      .insert(this._db({ name: productData.name, type: productData.type || 'bidon', price: parseFloat(productData.price) || 0, unit: productData.unit || 'unidad', active: true }))
      .select().single();
    return this._js(data);
  },
  async updateProduct(id, productData) {
    const { data } = await this._sb.from('products').update(this._db(productData)).eq('id', id).select().single();
    return this._js(data);
  },

  // ─── CLIENTS ─────────────────────────────────────────────────────────────
  async _genClientCode() {
    const { data } = await this._sb.from('clients').select('code').order('id', { ascending: false }).limit(1);
    const maxNum = data && data[0] ? parseInt((data[0].code || '').replace('NAT-', '') || '0') : 0;
    return `NAT-${String(maxNum + 1).padStart(3, '0')}`;
  },
  _genReferralCode(code) { return code.replace('NAT-', '') + '-REF'; },

  async getClients(includeInactive = false) {
    let q = this._sb.from('clients').select('*').order('name');
    if (!includeInactive) q = q.eq('active', true);
    const { data } = await q;
    return this._jsMany(data);
  },
  async getClient(id) {
    const { data } = await this._sb.from('clients').select('*').eq('id', id).single();
    return this._js(data);
  },
  async getClientByToken(token) {
    const { data } = await this._sb.from('clients').select('*').eq('access_token', token).eq('active', true).single();
    return this._js(data);
  },
  async regenerateClientToken(id) {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    await this._sb.from('clients').update({ access_token: token }).eq('id', id);
    return token;
  },
  clientPortalUrl(token) {
    const base = window.location.href.replace('index.html', '').replace(/\/$/, '');
    return `${base}/client.html?token=${token}`;
  },
  async getClientByReferral(code) {
    const { data } = await this._sb.from('clients').select('*').eq('referral_code', code).single();
    return this._js(data);
  },
  async createClient(clientData) {
    const code = await this._genClientCode();
    const referralCode = this._genReferralCode(code);
    const dbData = this._db({
      code, name: clientData.name, address: clientData.address || '',
      city: clientData.city || '', phone: clientData.phone || '', email: clientData.email || '',
      zoneId: clientData.zoneId ? parseInt(clientData.zoneId) : null,
      type: clientData.type || 'hogar', frequency: clientData.frequency || 'semanal',
      deliveryDay: clientData.deliveryDay || '', points: 0, referralCode,
      referredBy: clientData.referredBy || null, active: true, notes: clientData.notes || '',
    });
    const { data, error } = await this._sb.from('clients').insert(dbData).select().single();
    if (error) throw new Error(error.message);
    const client = this._js(data);
    if (clientData.referredBy) {
      const cfg = await this.getConfig();
      await this.addPoints(clientData.referredBy, cfg.referralBonus, 'referral', 'Nuevo referido registrado');
      if (cfg.referralPrizeEvery > 0) {
        const { count } = await this._sb.from('clients').select('*', { count: 'exact', head: true })
          .eq('referred_by', clientData.referredBy);
        if (count > 0 && count % cfg.referralPrizeEvery === 0) {
          await this.addPoints(clientData.referredBy, cfg.referralPrizePts || 200, 'referral',
            `🎁 Premio: ${count} referidos acumulados`);
        }
      }
    }
    return client;
  },
  async updateClient(id, clientData) {
    const { code, referralCode, ...rest } = clientData;
    const { data, error } = await this._sb.from('clients').update(this._db(rest)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return this._js(data);
  },
  async deleteClient(id) {
    await this._sb.from('clients').update({ active: false }).eq('id', id);
  },
  async getInactiveClients(days = 21) {
    const [clients, { data: orders }] = await Promise.all([
      this.getClients(),
      this._sb.from('orders').select('client_id, created_at').order('created_at', { ascending: false }),
    ]);
    const cutoff = new Date(Date.now() - days * 86400000);
    return clients.map(c => {
      const last = (orders || []).find(o => o.client_id === c.id);
      const lastDate = last ? new Date(last.created_at) : null;
      return { ...c, lastOrderDate: lastDate?.toISOString() || null, daysSince: lastDate ? Math.floor((Date.now() - lastDate) / 86400000) : null };
    }).filter(c => !c.lastOrderDate || new Date(c.lastOrderDate) < cutoff);
  },
  async adjustClientBalance(clientId, amount, description) {
    const client = await this.getClient(clientId);
    const newBalance = parseFloat(((client.balance || 0) + amount).toFixed(2));
    const { error } = await this._sb.from('clients').update({ balance: newBalance }).eq('id', clientId);
    if (error) throw new Error(error.message);
    await this._sb.from('balance_movements').insert({ client_id: clientId, amount, description });
    return newBalance;
  },
  async getClientBalanceMovements(clientId) {
    const { data } = await this._sb.from('balance_movements').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(20);
    return this._jsMany(data);
  },

  async processReferralReward(clientId, invoiceTotal) {
    const client = await this.getClient(clientId);
    if (!client || !client.referredBy || client.referralDiscountUsed) return;
    const cfg = await this.getConfig();
    if (!cfg.referralsEnabled) return;

    const discountAmt = parseFloat(((cfg.referralReferredDiscount || 0) / 100 * invoiceTotal).toFixed(2));
    if (discountAmt > 0) {
      await this.adjustClientBalance(clientId, discountAmt,
        `Descuento referido - ${cfg.referralReferredDiscount}% de primera factura`);
    }

    const referrerReward = parseFloat(cfg.referralReferrerReward || 0);
    if (referrerReward > 0) {
      await this.adjustClientBalance(client.referredBy, referrerReward,
        `Premio por referir a ${client.name}`);
    }

    await this._sb.from('clients').update({ referral_discount_used: true }).eq('id', clientId);
  },

  // ─── LEADS ───────────────────────────────────────────────────────────────
  async getLeads() {
    const { data } = await this._sb.from('leads').select('*').order('created_at', { ascending: false });
    return this._jsMany(data);
  },
  async createLead(leadData) {
    const notes = leadData.referrerClientId
      ? `[Referido por cliente ID:${leadData.referrerClientId}] ${leadData.notes || ''}`.trim()
      : (leadData.notes || '');
    const { data, error } = await this._sb.from('leads').insert(this._db({
      name: leadData.name, phone: leadData.phone || '', address: leadData.address || '',
      city: leadData.city || '', type: leadData.type || 'empresa', source: leadData.source || 'manual',
      notes, status: 'nuevo', osmId: leadData.osmId || '', website: leadData.website || '',
    })).select().single();
    if (error) throw new Error(error.message);
    return this._js(data);
  },
  async updateLead(id, data) {
    const { data: row, error } = await this._sb.from('leads').update(this._db(data)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return this._js(row);
  },
  async deleteLead(id) {
    await this._sb.from('leads').delete().eq('id', id);
  },

  // ─── ORDERS ──────────────────────────────────────────────────────────────
  async getOrders() {
    const { data } = await this._sb.from('orders').select('*').order('created_at', { ascending: false });
    return this._jsMany(data);
  },
  async getOrder(id) {
    const { data } = await this._sb.from('orders').select('*').eq('id', id).single();
    return this._js(data);
  },
  async getClientOrders(clientId) {
    const { data } = await this._sb.from('orders').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    return this._jsMany(data);
  },
  async getTodayOrders() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await this._sb.from('orders').select('*').eq('delivery_date', today);
    return this._jsMany(data);
  },
  async getOrdersByDate(date) {
    const { data } = await this._sb.from('orders').select('*').eq('delivery_date', date);
    return this._jsMany(data);
  },
  async createOrder(orderData) {
    const dbData = this._db({
      clientId: parseInt(orderData.clientId), status: 'pendiente',
      items: orderData.items || [], total: parseFloat(orderData.total) || 0,
      deliveryDate: orderData.deliveryDate || new Date().toISOString().split('T')[0],
      notes: orderData.notes || '',
    });
    const { data } = await this._sb.from('orders').insert(dbData).select().single();
    return this._js(data);
  },
  async updateOrder(id, orderData) {
    const { data: current } = await this._sb.from('orders').select('status').eq('id', id).single();
    const wasDelivered = current && current.status !== 'entregado' && orderData.status === 'entregado';
    const { data } = await this._sb.from('orders')
      .update({ ...this._db(orderData), updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    const order = this._js(data);
    if (wasDelivered) {
      const cfg = await this.getConfig();
      await this.addPoints(order.clientId, cfg.pointsPerOrder, 'earned', `Pedido #${id} entregado`);
    }
    return order;
  },
  async deleteOrder(id) {
    await this._sb.from('orders').update({ status: 'cancelado' }).eq('id', id);
  },

  // ─── INVOICES ────────────────────────────────────────────────────────────
  async _genInvoiceNumber() {
    const { data } = await this._sb.from('invoices').select('number').order('id', { ascending: false }).limit(1);
    const maxNum = data && data[0] ? parseInt((data[0].number || '').replace('FAC-', '') || '0') : 0;
    return `FAC-${String(maxNum + 1).padStart(4, '0')}`;
  },
  async getInvoices() {
    const { data } = await this._sb.from('invoices').select('*').order('created_at', { ascending: false });
    return this._jsMany(data);
  },
  async getInvoice(id) {
    const { data } = await this._sb.from('invoices').select('*').eq('id', id).single();
    return this._js(data);
  },
  async getClientInvoices(clientId) {
    const { data } = await this._sb.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    return this._jsMany(data);
  },
  async createInvoice(invoiceData) {
    const number = await this._genInvoiceNumber();
    const dbData = this._db({
      number, orderId: invoiceData.orderId || null,
      clientId: parseInt(invoiceData.clientId), total: parseFloat(invoiceData.total) || 0,
      paymentMethod: invoiceData.paymentMethod || 'efectivo',
      paymentStatus: invoiceData.paymentStatus || 'pendiente',
      notes: invoiceData.notes || '', items: invoiceData.items || [],
    });
    const { data } = await this._sb.from('invoices').insert(dbData).select().single();
    return this._js(data);
  },
  async updateInvoice(id, invoiceData) {
    const updateData = { ...invoiceData };
    if (updateData.paymentStatus === 'pagado') {
      const { data: curr } = await this._sb.from('invoices').select('paid_at').eq('id', id).single();
      if (!curr?.paid_at) updateData.paidAt = new Date().toISOString();
    }
    const { data } = await this._sb.from('invoices').update(this._db(updateData)).eq('id', id).select().single();
    return this._js(data);
  },

  // ─── LOYALTY ─────────────────────────────────────────────────────────────
  async getPointsHistory(clientId = null) {
    let q = this._sb.from('points_history').select('*').order('created_at', { ascending: false });
    if (clientId) q = q.eq('client_id', clientId);
    const { data } = await q;
    return this._jsMany(data);
  },
  async addPoints(clientId, points, action, description) {
    const { data: client } = await this._sb.from('clients').select('points').eq('id', clientId).single();
    if (client) {
      const newPoints = (client.points || 0) + points;
      await this._sb.from('clients').update({ points: newPoints }).eq('id', clientId);
      await this._sb.from('points_history').insert({
        client_id: parseInt(clientId), points, action, description,
      });
    }
  },
  async redeemPoints(clientId, points, description) {
    const { data: client } = await this._sb.from('clients').select('points').eq('id', clientId).single();
    if (client && client.points >= points) {
      await this._sb.from('clients').update({ points: client.points - points }).eq('id', clientId);
      await this._sb.from('points_history').insert({
        client_id: parseInt(clientId), points: -points, action: 'redeemed', description,
      });
      return true;
    }
    return false;
  },

  // ─── PROMOTIONS ──────────────────────────────────────────────────────────
  async getPromotions() {
    const { data } = await this._sb.from('promotions').select('*').order('id');
    return this._jsMany(data);
  },
  async createPromotion(promoData) {
    const { data } = await this._sb.from('promotions')
      .insert(this._db({ ...promoData, active: true })).select().single();
    return this._js(data);
  },
  async updatePromotion(id, promoData) {
    await this._sb.from('promotions').update(this._db(promoData)).eq('id', id);
  },
  async deletePromotion(id) {
    await this._sb.from('promotions').delete().eq('id', id);
  },

  // ─── ANALYTICS ───────────────────────────────────────────────────────────
  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7);
    const [orders, clients, invoices] = await Promise.all([
      this.getOrders(), this.getClients(), this.getInvoices(),
    ]);
    const todayOrders = orders.filter(o => o.deliveryDate === today);
    const monthOrders = orders.filter(o => (o.deliveryDate || '').startsWith(monthStart));
    const todayRevenue = invoices.filter(i => (i.createdAt || '').startsWith(today) && i.paymentStatus === 'pagado').reduce((s, i) => s + (i.total || 0), 0);
    const monthRevenue = invoices.filter(i => (i.createdAt || '').startsWith(monthStart) && i.paymentStatus === 'pagado').reduce((s, i) => s + (i.total || 0), 0);
    const pendingPayments = invoices.filter(i => i.paymentStatus === 'pendiente').reduce((s, i) => s + (i.total || 0), 0);
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayRevenue = invoices.filter(inv => (inv.createdAt || '').startsWith(dateStr) && inv.paymentStatus === 'pagado').reduce((s, inv) => s + (inv.total || 0), 0);
      return { date: dateStr, day: d.toLocaleDateString('es-AR', { weekday: 'short' }), orders: orders.filter(o => o.deliveryDate === dateStr && o.status === 'entregado').length, revenue: dayRevenue };
    });
    const ordersByClient = {};
    orders.forEach(o => { ordersByClient[o.clientId] = (ordersByClient[o.clientId] || 0) + 1; });
    const clientsWithOrders = clients.filter(c => ordersByClient[c.id] >= 1).length;
    const clientsWithRepeat = clients.filter(c => ordersByClient[c.id] >= 2).length;
    const repurchaseRate = clientsWithOrders > 0 ? Math.round(clientsWithRepeat / clientsWithOrders * 100) : 0;
    return {
      totalClients: clients.length,
      newClientsThisMonth: clients.filter(c => (c.createdAt || '').startsWith(monthStart)).length,
      todayOrdersCount: todayOrders.length,
      todayPendingCount: todayOrders.filter(o => o.status === 'pendiente').length,
      todayDeliveredCount: todayOrders.filter(o => o.status === 'entregado').length,
      todayRevenue, monthRevenue, monthOrdersCount: monthOrders.length, pendingPayments, weekData, repurchaseRate,
    };
  },

  // ─── COSTS ───────────────────────────────────────────────────────────────
  async getCosts(month) {
    let q = this._sb.from('costs').select('*').order('date', { ascending: false });
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const nextStart = new Date(y, m, 1).toISOString().slice(0, 10);
      q = q.gte('date', `${month}-01`).lt('date', nextStart);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return this._jsMany(data);
  },
  _costRow(data) {
    return {
      name: data.name,
      category: data.category,
      amount: data.amount,
      date: data.date,
      frequency: data.frequency || null,
      notes: data.notes || null,
    };
  },
  async createCost(data) {
    const { error } = await this._sb.from('costs').insert(this._costRow(data));
    if (error) throw new Error(error.message);
  },
  async updateCost(id, data) {
    const { error } = await this._sb.from('costs').update(this._costRow(data)).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async deleteCost(id) {
    const { error } = await this._sb.from('costs').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  async getMonthRevenue(ym) {
    const [y, m] = ym.split('-').map(Number);
    const start = `${ym}-01`;
    const end = new Date(y, m, 1).toISOString().slice(0, 10);
    const { data, error } = await this._sb.from('invoices')
      .select('total')
      .eq('payment_status', 'pagado')
      .gte('created_at', start)
      .lt('created_at', end);
    if (error) throw new Error(error.message);
    return (data || []).reduce((s, r) => s + (r.total || 0), 0);
  },
  async getMonthBottlesDelivered(ym) {
    const [y, m] = ym.split('-').map(Number);
    const start = `${ym}-01`;
    const end = new Date(y, m, 1).toISOString().slice(0, 10);
    const { data, error } = await this._sb.from('orders')
      .select('items')
      .eq('status', 'entregado')
      .gte('delivery_date', start)
      .lt('delivery_date', end);
    if (error) throw new Error(error.message);
    return (data || []).reduce((s, o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return s + items.reduce((si, i) => si + (i.quantity || 0), 0);
    }, 0);
  },

  // ─── DISPENSERS ──────────────────────────────────────────────────────────
  async getDispensers() {
    const { data } = await this._sb.from('dispensers').select('*').order('created_at', { ascending: false });
    return this._jsMany(data);
  },
  async createDispenser(data) {
    const { error } = await this._sb.from('dispensers').insert(this._db(data));
    if (error) throw new Error(error.message);
  },
  async updateDispenser(id, data) {
    const { error } = await this._sb.from('dispensers').update(this._db(data)).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async deleteDispenser(id) {
    const { error } = await this._sb.from('dispensers').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ─── MACHINES ────────────────────────────────────────────────────────────
  async getMachines() {
    const { data } = await this._sb.from('machines').select('*').order('created_at', { ascending: true });
    return this._jsMany(data);
  },
  async createMachine(data) {
    const { data: row, error } = await this._sb.from('machines').insert(this._db(data)).select().single();
    if (error) throw new Error(error.message);
    return this._js(row);
  },
  async updateMachine(id, data) {
    const { error } = await this._sb.from('machines').update(this._db(data)).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async deleteMachine(id) {
    await this._sb.from('maintenance_logs').delete().eq('machine_id', id);
    const { error } = await this._sb.from('machines').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  async logMaintenance(data) {
    const { resetLiters, machineId, ...logData } = data;
    const { error } = await this._sb.from('maintenance_logs').insert(this._db({ ...logData, machineId }));
    if (error) throw new Error(error.message);
    if (resetLiters) {
      const machine = (await this._sb.from('machines').select('current_liters').eq('id', machineId).single()).data;
      const currentLiters = machine?.current_liters || 0;
      await this._sb.from('machines').update({
        liters_at_last_maintenance: currentLiters,
        last_maintenance_date: logData.date,
      }).eq('id', machineId);
    }
  },
  async addMachineLiters(machineId, liters) {
    const { data: machine } = await this._sb.from('machines').select('current_liters').eq('id', machineId).single();
    const current = machine?.current_liters || 0;
    const { error } = await this._sb.from('machines').update({ current_liters: current + liters }).eq('id', machineId);
    if (error) throw new Error(error.message);
  },
  async getMaintenanceLogs(machineId) {
    let q = this._sb.from('maintenance_logs').select('*').order('date', { ascending: false });
    if (machineId) q = q.eq('machine_id', machineId);
    const { data } = await q;
    return this._jsMany(data);
  },

  // ─── DRIVER LOCATION ─────────────────────────────────────────────────────
  async getDriverLocation() {
    const { data } = await this._sb
      .from('driver_locations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);
    return data && data.length > 0 ? this._js(data[0]) : null;
  },
  async upsertDriverLocation(lat, lng, driverName) {
    await this._sb.from('driver_locations').upsert(
      { id: 1, lat, lng, driver_name: driverName, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  },

  // ─── AUTH ─────────────────────────────────────────────────────────────────
  async setAdminUser(userId) {
    this._configCache = null;
    await this._sb.from('config').update({ admin_user_id: userId }).eq('id', 1);
  },

  // ─── FORMATTING ──────────────────────────────────────────────────────────
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

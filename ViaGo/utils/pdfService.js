// NATIVA - Invoice and report printing via browser print dialog

const PDFService = {

  _open(html, title) {
    const win = window.open('', '_blank', 'width=780,height=900');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
  },

  _baseStyles() {
    return `*{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;padding:40px;max-width:680px;margin:0 auto;}
    table{width:100%;border-collapse:collapse;}
    thead th{padding:9px 12px;background:#f8fafc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;text-align:left;}
    thead th:not(:first-child){text-align:right;}
    tbody td{padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;}
    tbody td:not(:first-child){text-align:right;}
    @media print{body{padding:20px;}}`;
  },

  _header(config, docType, docNumber, date) {
    return `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #2563eb;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:46px;height:46px;background:#2563eb;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;">💧</div>
        <div>
          <div style="font-size:22px;font-weight:800;">${config.companyName || 'NATIVA'}</div>
          <div style="font-size:12px;color:#64748b;">${config.tagline || ''}</div>
          ${config.phone ? `<div style="font-size:12px;color:#64748b;">${config.phone}</div>` : ''}
          ${config.address ? `<div style="font-size:12px;color:#64748b;">${config.address}</div>` : ''}
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;">${docType}</div>
        <div style="font-size:22px;font-weight:800;color:#2563eb;">${docNumber}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">${date}</div>
      </div>
    </div>`;
  },

  _clientSection(client) {
    return `<div style="margin-bottom:20px;padding:14px;background:#f8fafc;border-radius:8px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:6px;">Cliente</div>
      <div style="font-size:15px;font-weight:700;">${client.name || ''}</div>
      ${client.code ? `<div style="font-size:12px;color:#64748b;">${client.code}</div>` : ''}
      ${client.address ? `<div style="font-size:12px;color:#64748b;">📍 ${client.address}${client.city ? `, ${client.city}` : ''}</div>` : ''}
      ${client.phone ? `<div style="font-size:12px;color:#64748b;">📞 ${client.phone}</div>` : ''}
    </div>`;
  },

  _itemsTable(items) {
    const rows = (items || []).map(i => `<tr>
      <td>${i.productName || '-'}</td>
      <td>${i.quantity}</td>
      <td>${DataService.formatCurrency(i.price)}</td>
      <td style="font-weight:600;">${DataService.formatCurrency(i.subtotal || i.price * i.quantity)}</td>
    </tr>`).join('');
    const total = (items || []).reduce((s, i) => s + (i.subtotal || i.price * i.quantity || 0), 0);
    return `<table style="margin-bottom:0;">
      <thead><tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td colspan="3" style="padding:12px;text-align:right;font-weight:800;font-size:14px;border-top:2px solid #e2e8f0;">TOTAL</td>
        <td style="padding:12px;text-align:right;font-weight:800;font-size:16px;border-top:2px solid #e2e8f0;color:#2563eb;">${DataService.formatCurrency(total)}</td>
      </tr></tfoot>
    </table>`;
  },

  _footer(config) {
    return `<div style="text-align:center;margin-top:28px;padding-top:14px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8;">
      <strong>${config.companyName}</strong>${config.email ? ` · ${config.email}` : ''}${config.phone ? ` · ${config.phone}` : ''}
      <br>Gracias por su preferencia
    </div>`;
  },

  printInvoice(invoice, client, config) {
    const statusColor = invoice.paymentStatus === 'pagado' ? '#059669' : '#D97706';
    const statusLabel = invoice.paymentStatus === 'pagado' ? 'PAGADO' : 'PENDIENTE';
    const payLabels   = { efectivo: 'Efectivo', transferencia: 'Transferencia bancaria', mercadopago: 'MercadoPago' };
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <title>${config.companyName} - ${invoice.number}</title>
      <style>${this._baseStyles()}</style></head><body>
      ${this._header(config, 'Factura', invoice.number, DataService.formatDateTime(invoice.createdAt))}
      <div style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;color:white;background:${statusColor};margin-bottom:16px;">${statusLabel}</div>
      ${this._clientSection(client)}
      <div style="margin-bottom:20px;">${this._itemsTable(invoice.items)}</div>
      <div style="background:#f8fafc;border-radius:8px;padding:14px;display:flex;justify-content:space-between;">
        <div><div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Forma de pago</div>
          <div style="font-size:13px;font-weight:600;margin-top:2px;">${payLabels[invoice.paymentMethod] || invoice.paymentMethod}</div></div>
        <div style="text-align:right;"><div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Estado</div>
          <div style="font-size:13px;font-weight:700;color:${statusColor};margin-top:2px;">${statusLabel}</div></div>
      </div>
      ${invoice.notes ? `<div style="margin-top:14px;padding:12px;background:#fffbeb;border-radius:8px;font-size:13px;color:#92400e;"><strong>Nota:</strong> ${invoice.notes}</div>` : ''}
      ${this._footer(config)}
    </body></html>`;
    this._open(html, `${config.companyName} - ${invoice.number}`);
  },

  printRemito(order, client, config) {
    const date = DataService.formatDate(order.deliveryDate || new Date().toISOString().slice(0, 10));
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <title>Remito - Pedido #${order.id}</title>
      <style>${this._baseStyles()}
      .sign-row{display:flex;gap:32px;margin-top:32px;}
      .sign-box{flex:1;border-top:1px solid #cbd5e1;padding-top:8px;font-size:12px;color:#64748b;text-align:center;}
      </style></head><body>
      ${this._header(config, 'Remito de entrega', `N° ${String(order.id).padStart(5,'0')}`, date)}
      ${this._clientSection(client)}
      <div style="margin-bottom:20px;">${this._itemsTable(order.items)}</div>
      ${order.envasesRecuperados > 0 ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin-bottom:20px;font-size:13px;">
          🫙 <strong>Envases recuperados:</strong> ${order.envasesRecuperados}
          &nbsp;&nbsp; <strong>Entregados:</strong> ${order.envasesEntregados || 0}
        </div>` : ''}
      ${order.notes ? `<div style="margin-bottom:20px;padding:12px;background:#fffbeb;border-radius:8px;font-size:13px;color:#92400e;"><strong>Nota:</strong> ${order.notes}</div>` : ''}
      <div class="sign-row">
        <div class="sign-box">Firma del cliente<br><br><br></div>
        <div class="sign-box">Aclaración</div>
        <div class="sign-box">DNI</div>
        <div class="sign-box">Repartidor</div>
      </div>
      ${this._footer(config)}
    </body></html>`;
    this._open(html, `Remito #${order.id}`);
  },

  printRecibo(invoice, client, config) {
    const payLabels = { efectivo: 'Efectivo', transferencia: 'Transferencia bancaria', mercadopago: 'MercadoPago' };
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <title>Recibo - ${invoice.number}</title>
      <style>${this._baseStyles()}</style></head><body>
      ${this._header(config, 'Recibo de pago', invoice.number, DataService.formatDateTime(invoice.paidAt || invoice.createdAt))}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
        <div style="font-size:11px;color:#16a34a;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;margin-bottom:6px;">Recibimos de</div>
        <div style="font-size:18px;font-weight:800;color:#1e293b;">${client.name}</div>
        <div style="font-size:13px;color:#64748b;margin-top:2px;">${client.code || ''}</div>
        <div style="font-size:32px;font-weight:900;color:#16a34a;margin:12px 0;">${DataService.formatCurrency(invoice.total)}</div>
        <div style="font-size:13px;color:#64748b;">en concepto de: ${(invoice.items || []).map(i => i.productName).join(', ') || 'servicios'}</div>
        <div style="margin-top:10px;font-size:13px;font-weight:600;color:#1e293b;">Forma de pago: ${payLabels[invoice.paymentMethod] || invoice.paymentMethod}</div>
      </div>
      <div style="display:flex;gap:32px;margin-top:32px;">
        <div style="flex:1;border-top:1px solid #cbd5e1;padding-top:8px;font-size:12px;color:#64748b;text-align:center;">Firma</div>
        <div style="flex:1;border-top:1px solid #cbd5e1;padding-top:8px;font-size:12px;color:#64748b;text-align:center;">Aclaración</div>
      </div>
      ${this._footer(config)}
    </body></html>`;
    this._open(html, `Recibo ${invoice.number}`);
  },

  textReceipt(order, client, config) {
    const items = (order.items || []).map(i => `• ${i.productName} x${i.quantity} — ${DataService.formatCurrency(i.subtotal || i.price * i.quantity)}`).join('\n');
    return `🧾 *Comprobante de entrega*\n${config.companyName}\n\n` +
      `👤 ${client.name}\n📍 ${client.address || ''}\n📅 ${DataService.formatDate(order.deliveryDate)}\n\n` +
      `${items}\n\n*Total: ${DataService.formatCurrency(order.total)}*\n\n` +
      `Gracias por su preferencia 💧`;
  },

  printDailySummary(date, orders, invoices, clients, zones) {
    const delivered = orders.filter(o => o.status === 'entregado');
    const pending = orders.filter(o => o.status === 'pendiente');
    const revenue = invoices.filter(i => i.paymentStatus === 'pagado').reduce((s, i) => s + i.total, 0);
    const pending_pay = invoices.filter(i => i.paymentStatus === 'pendiente').reduce((s, i) => s + i.total, 0);
    const config = DataService.getConfig();

    const rows = orders.map(o => {
      const client = clients.find(c => c.id === o.clientId) || {};
      const zone = zones.find(z => z.id === client.zoneId) || {};
      const statusColors = { entregado: '#059669', pendiente: '#D97706', cancelado: '#DC2626' };
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;">${client.code || '-'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;">${client.name || '-'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;">${zone.name || '-'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right;">${DataService.formatCurrency(o.total)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:center;"><span style="color:${statusColors[o.status]};font-weight:700;">${o.status.toUpperCase()}</span></td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Resumen ${DataService.formatDate(date)}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:32px;max-width:800px;margin:0 auto;}
    h1{font-size:20px;font-weight:800;color:#2563eb;}h2{font-size:14px;font-weight:600;color:#64748b;margin-bottom:16px;}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0;}
    .stat{background:#f8fafc;border-radius:8px;padding:14px;}.stat-value{font-size:20px;font-weight:800;color:#1e293b;}.stat-label{font-size:11px;color:#64748b;margin-top:2px;}
    table{width:100%;border-collapse:collapse;margin-top:12px;}thead th{padding:8px 10px;background:#f1f5f9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;text-align:left;}
    @media print{body{padding:16px;}}</style></head><body>
    <h1>📊 Resumen del día — ${DataService.formatDate(date)}</h1>
    <h2>${config.companyName}</h2>
    <div class="stats">
      <div class="stat"><div class="stat-value">${orders.length}</div><div class="stat-label">Total pedidos</div></div>
      <div class="stat"><div class="stat-value">${delivered.length}</div><div class="stat-label">Entregados</div></div>
      <div class="stat"><div class="stat-value" style="color:#059669;">${DataService.formatCurrency(revenue)}</div><div class="stat-label">Cobrado</div></div>
      <div class="stat"><div class="stat-value" style="color:#D97706;">${DataService.formatCurrency(pending_pay)}</div><div class="stat-label">Pendiente cobro</div></div>
    </div>
    <table><thead><tr><th>Código</th><th>Cliente</th><th>Zona</th><th style="text-align:right">Total</th><th style="text-align:center">Estado</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div style="margin-top:24px;font-size:11px;color:#94a3b8;text-align:center;">Impreso: ${new Date().toLocaleString('es-AR')} · ${config.companyName}</div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
  },
};

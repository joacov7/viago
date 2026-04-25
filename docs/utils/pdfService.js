// NATIVA - Invoice and report printing via browser print dialog

const PDFService = {
  printInvoice(invoice, client, config) {
    const items = (invoice.items || []).map(item => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${item.productName || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">${DataService.formatCurrency(item.price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">${DataService.formatCurrency(item.subtotal)}</td>
      </tr>`).join('');

    const statusColor = invoice.paymentStatus === 'pagado' ? '#059669' : '#D97706';
    const statusLabel = invoice.paymentStatus === 'pagado' ? 'PAGADO' : 'PENDIENTE';
    const paymentLabels = { efectivo: 'Efectivo', transferencia: 'Transferencia bancaria', mercadopago: 'MercadoPago' };

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${config.companyName} - ${invoice.number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; color:#1e293b; background:#fff; padding:40px; max-width:680px; margin:0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:24px; border-bottom:2px solid #2563eb; }
    .brand { display:flex; align-items:center; gap:12px; }
    .brand-icon { width:48px; height:48px; background:#2563eb; border-radius:12px; display:flex; align-items:center; justify-content:center; color:white; font-size:24px; }
    .brand-name { font-size:24px; font-weight:800; color:#1e293b; }
    .brand-tagline { font-size:12px; color:#64748b; }
    .invoice-info { text-align:right; }
    .invoice-number { font-size:20px; font-weight:700; color:#2563eb; }
    .invoice-date { font-size:13px; color:#64748b; margin-top:4px; }
    .status-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; color:white; background:${statusColor}; margin-top:6px; }
    .section { margin-bottom:24px; }
    .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#94a3b8; margin-bottom:8px; }
    .client-name { font-size:16px; font-weight:700; color:#1e293b; }
    .client-detail { font-size:13px; color:#64748b; margin-top:2px; }
    table { width:100%; border-collapse:collapse; margin-bottom:16px; }
    thead th { padding:10px 12px; background:#f8fafc; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; text-align:left; }
    thead th:last-child, thead th:nth-child(2), thead th:nth-child(3) { text-align:right; }
    .total-row td { padding:12px; font-size:16px; font-weight:700; color:#1e293b; text-align:right; border-top:2px solid #e2e8f0; }
    .payment-info { background:#f8fafc; border-radius:8px; padding:16px; display:flex; justify-content:space-between; align-items:center; }
    .footer { text-align:center; margin-top:32px; padding-top:16px; border-top:1px solid #f1f5f9; font-size:12px; color:#94a3b8; }
    @media print { body { padding:20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-icon">💧</div>
      <div>
        <div class="brand-name">${config.companyName}</div>
        <div class="brand-tagline">${config.tagline || ''}</div>
        ${config.phone ? `<div class="brand-tagline">${config.phone}</div>` : ''}
      </div>
    </div>
    <div class="invoice-info">
      <div class="invoice-number">${invoice.number}</div>
      <div class="invoice-date">${DataService.formatDateTime(invoice.createdAt)}</div>
      <div><span class="status-badge">${statusLabel}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="client-name">${client.name}</div>
    <div class="client-detail">${client.code}</div>
    ${client.address ? `<div class="client-detail">${client.address}</div>` : ''}
    ${client.phone ? `<div class="client-detail">Tel: ${client.phone}</div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Detalle del pedido</div>
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th style="text-align:center">Cant.</th>
          <th style="text-align:right">Precio unit.</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${items}</tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="3">TOTAL</td>
          <td>${DataService.formatCurrency(invoice.total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="payment-info">
    <div>
      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Forma de pago</div>
      <div style="font-size:14px;font-weight:600;color:#1e293b;margin-top:2px;">${paymentLabels[invoice.paymentMethod] || invoice.paymentMethod}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Estado</div>
      <div style="font-size:14px;font-weight:700;color:${statusColor};margin-top:2px;">${statusLabel}</div>
    </div>
  </div>

  ${invoice.notes ? `<div style="margin-top:16px;padding:12px;background:#fffbeb;border-radius:8px;font-size:13px;color:#92400e;"><strong>Nota:</strong> ${invoice.notes}</div>` : ''}

  <div class="footer">
    <strong>${config.companyName}</strong> · ${config.tagline || ''}
    ${config.address ? ` · ${config.address}` : ''}
    ${config.email ? ` · ${config.email}` : ''}
    <br>Gracias por su preferencia
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=780,height=900');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
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

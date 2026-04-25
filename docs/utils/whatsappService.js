// NATIVA - WhatsApp link generation and message templates

const WhatsAppService = {
  link(phone, message) {
    const clean = (phone || '').replace(/\D/g, '');
    if (!clean) return '#';
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  },

  callLink(phone) {
    const clean = (phone || '').replace(/\D/g, '');
    return `tel:+${clean}`;
  },

  orderConfirmation(client, order) {
    const items = (order.items || []).map(i => `  • ${i.quantity}x ${i.productName} - ${DataService.formatCurrency(i.subtotal)}`).join('\n');
    const msg = `¡Hola ${client.name}! 👋\n\nTe confirmamos tu pedido NATIVA:\n\n${items}\n\n💰 *Total: ${DataService.formatCurrency(order.total)}*\n📅 Entrega: ${DataService.formatDate(order.deliveryDate)}\n\n¡Gracias por elegirnos! 💧`;
    return this.link(client.phone, msg);
  },

  deliveryNotice(client, order) {
    const msg = `¡Hola ${client.name}! 🚚\n\nTu pedido *NATIVA* está en camino.\nLlegamos en breve a *${client.address}*.\n\nTotal a abonar: *${DataService.formatCurrency(order.total)}*\n\nAnte cualquier consulta respondé este mensaje. 💧`;
    return this.link(client.phone, msg);
  },

  paymentRequest(client, invoice) {
    const msg = `¡Hola ${client.name}! 💳\n\nTe recordamos que tenés un pago pendiente:\n\n📄 Comprobante: *${invoice.number}*\n💰 Total: *${DataService.formatCurrency(invoice.total)}*\n\nPodés abonar por efectivo, transferencia o MercadoPago.\n\n¡Muchas gracias! 💧 *NATIVA*`;
    return this.link(client.phone, msg);
  },

  promotion(client, promoText) {
    const msg = `¡Hola ${client.name}! 🎁\n\n${promoText}\n\n¿Te interesa? Respondé este mensaje o llamanos.\n\n💧 *Equipo NATIVA*`;
    return this.link(client.phone, msg);
  },

  referralShare(client) {
    const msg = `¡Hola! Te comparto mi código de referido de *NATIVA* 💧\n\nUsá el código *${client.referralCode}* al registrarte y ambos recibimos un beneficio especial. 🎁\n\nPedís tu agua de calidad a domicilio fácilmente.`;
    return this.link(client.phone, msg);
  },

  generic(client) {
    return this.link(client.phone, `¡Hola ${client.name}! 👋 Te contactamos desde NATIVA 💧`);
  },

  openMaps(address) {
    const encoded = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  },

  openRoute(addresses) {
    if (!addresses || addresses.length === 0) return '#';
    const origin = encodeURIComponent(addresses[0]);
    const destination = encodeURIComponent(addresses[addresses.length - 1]);
    const waypoints = addresses.slice(1, -1).map(a => encodeURIComponent(a)).join('|');
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    if (waypoints) url += `&waypoints=optimize:true|${waypoints}`;
    return url;
  },
};

(function () {
  function deliveryScreen(params) {
    if (!window.HopprUI.requireUser()) return '';
    const tab = params.tab || 'parcel';
    return window.HopprUI.shell('Delivery Services', 'Book parcel delivery or food delivery between colleges, faculties and campus vendors.',
      '<div class="segmented"><button type="button" id="parcelTab" class="' + (tab === 'parcel' ? 'active' : '') + '">Parcel</button><button type="button" id="foodTab" class="' + (tab === 'food' ? 'active' : '') + '">Food</button></div>' +
      (tab === 'parcel' ? parcelForm() : foodForm()) + deliveryList()
    );
  }

  function paymentOptions() {
    return [
      'Cash after completion',
      'QR Pay after completion',
      'Visa •••• 2468',
      'Mastercard •••• 8921',
      'Add new bank card'
    ];
  }

  function resolvePaymentMethod(fieldId) {
    const field = window.HopprUI.el(fieldId);
    let method = field ? field.value : 'Cash after completion';
    if (method === 'Add new bank card') {
      const last4 = prompt('Enter last 4 digits of the new card:', '1234') || '1234';
      method = 'New Bank Card •••• ' + last4.slice(-4);
    }
    return method;
  }

  function isAfterCompletionPayment(method) {
    return method === 'Cash after completion' || method === 'QR Pay after completion';
  }

  function parcelForm() {
    return '<form id="parcelForm" class="form-card">' +
      '<div id="deliveryRouteMap">' + window.HopprUI.map('Parcel pickup and drop-off route', 'A tracking code will be generated after confirmation.', 'Kolej Tun Razak', 'Faculty of Computing') + '</div>' +
      window.HopprUI.select('parcelPickup', 'Pickup Location', window.HopprData.locations, 'Kolej Tun Razak') +
      window.HopprUI.select('parcelDropoff', 'Drop-off Location', window.HopprData.locations, 'Faculty of Computing') +
      window.HopprUI.textArea('parcelDetails', 'Parcel Details', 'Small document envelope, receiver: Dr. Ahmad, receiver phone: +60 11 2345 6789', 'Parcel size, receiver and notes') +
      window.HopprUI.select('parcelPaymentMethod', 'Payment Method', paymentOptions(), 'Cash after completion') +
      '<button class="primary-btn" type="submit">Book Parcel Delivery</button>' +
      '</form>';
  }

  function foodForm() {
    return '<form id="foodForm" class="form-card">' +
      '<div id="deliveryRouteMap">' + window.HopprUI.map('Food pickup from campus vendors', 'Driver collects and delivers food with live status updates.', 'ArkED Meranti Food Court', 'Kolej Rahman Putra') + '</div>' +
      window.HopprUI.select('foodVendor', 'Campus Vendor', window.HopprData.vendors, 'ArkED Meranti Food Court') +
      window.HopprUI.select('foodDropoff', 'Delivery Location', window.HopprData.locations, 'Kolej Rahman Putra') +
      window.HopprUI.textArea('foodOrder', 'Food Order Details', 'Nasi goreng ayam, less spicy, one iced tea. Please call when arrived.', 'Food name, quantity and notes') +
      window.HopprUI.select('foodPaymentMethod', 'Payment Method', paymentOptions(), 'QR Pay after completion') +
      '<button class="primary-btn" type="submit">Order Food Delivery</button>' +
      '</form>';
  }

  function deliveryList() {
    const orders = window.HopprState.deliveryOrders;
    if (!orders.length) return '<div class="empty-card"><strong>No delivery records yet</strong>Use the parcel or food form to create a trackable delivery order.</div>';
    return '<h3 class="section-title">Recent Deliveries</h3><div class="list-card">' + orders.map(function (order) {
      return '<div class="list-row"><div class="row-icon">' + (order.type === 'Food' ? '🍱' : '📦') + '</div><div class="row-main"><strong>' + window.HopprUI.escape(order.id) + ' · ' + window.HopprUI.escape(order.type) + '</strong><span>' + window.HopprUI.escape(order.from) + ' → ' + window.HopprUI.escape(order.to) + '<br>' + window.HopprUI.escape(order.date) + '</span></div><span class="badge warning">' + window.HopprUI.escape(order.status) + '</span></div>';
    }).join('') + '</div>';
  }

  function refreshDeliveryMap() {
    const mapBox = window.HopprUI.el('deliveryRouteMap');
    if (!mapBox) return;
    const parcelPickup = window.HopprUI.el('parcelPickup');
    const parcelDropoff = window.HopprUI.el('parcelDropoff');
    const foodVendor = window.HopprUI.el('foodVendor');
    const foodDropoff = window.HopprUI.el('foodDropoff');
    if (parcelPickup && parcelDropoff) {
      mapBox.innerHTML = window.HopprUI.map('Parcel pickup and drop-off route', parcelPickup.value + ' → ' + parcelDropoff.value, parcelPickup.value, parcelDropoff.value);
    }
    if (foodVendor && foodDropoff) {
      mapBox.innerHTML = window.HopprUI.map('Food pickup from campus vendors', foodVendor.value + ' → ' + foodDropoff.value, foodVendor.value, foodDropoff.value);
    }
  }

  function bindDelivery(params) {
    ['parcelPickup', 'parcelDropoff', 'foodVendor', 'foodDropoff'].forEach(function (id) {
      const field = window.HopprUI.el(id);
      if (field) field.addEventListener('change', refreshDeliveryMap);
    });
    const parcelTab = window.HopprUI.el('parcelTab');
    const foodTab = window.HopprUI.el('foodTab');
    if (parcelTab) parcelTab.addEventListener('click', function () { window.HopprRouter.go('delivery', { tab: 'parcel' }); });
    if (foodTab) foodTab.addEventListener('click', function () { window.HopprRouter.go('delivery', { tab: 'food' }); });

    const parcelFormElement = window.HopprUI.el('parcelForm');
    if (parcelFormElement) parcelFormElement.addEventListener('submit', function (event) {
      event.preventDefault();
      const from = window.HopprUI.el('parcelPickup').value;
      const to = window.HopprUI.el('parcelDropoff').value;
      const details = window.HopprUI.el('parcelDetails').value.trim();
      if (from === to) {
        window.HopprUI.toast('Pickup and drop-off cannot be the same.', 'danger');
        return;
      }
      if (!details) {
        window.HopprUI.toast('Please describe the parcel.', 'danger');
        return;
      }
      const order = { id: window.HopprUI.createId('P'), type: 'Parcel', from, to, details, status: 'Driver Assigned', fee: 3.8, paymentMethod: resolvePaymentMethod('parcelPaymentMethod'), code: Math.floor(100000 + Math.random() * 899999), date: 'Today, just now' };
      window.HopprState.activeDelivery = order;
      window.HopprState.deliveryOrders.unshift(order);
      window.HopprState.notifications.unshift('Parcel tracking code ' + order.code + ' generated.');
      window.HopprUI.toast('Parcel delivery created with tracking code ' + order.code + '.', 'success');
      window.HopprRouter.go('deliveryTracking');
    });

    const foodFormElement = window.HopprUI.el('foodForm');
    if (foodFormElement) foodFormElement.addEventListener('submit', function (event) {
      event.preventDefault();
      const vendor = window.HopprUI.el('foodVendor').value;
      const to = window.HopprUI.el('foodDropoff').value;
      const orderText = window.HopprUI.el('foodOrder').value.trim();
      if (!orderText) {
        window.HopprUI.toast('Please enter your food order details.', 'danger');
        return;
      }
      const order = { id: window.HopprUI.createId('F'), type: 'Food', from: vendor, to, details: orderText, status: 'Preparing Food', fee: 4.6, paymentMethod: resolvePaymentMethod('foodPaymentMethod'), code: Math.floor(100000 + Math.random() * 899999), date: 'Today, just now' };
      window.HopprState.activeDelivery = order;
      window.HopprState.deliveryOrders.unshift(order);
      window.HopprState.notifications.unshift('Food delivery order ' + order.id + ' has been sent to ' + vendor + '.');
      window.HopprUI.toast('Food order created and sent to driver.', 'success');
      window.HopprRouter.go('deliveryTracking');
    });
  }

  function deliveryTrackingScreen() {
    if (!window.HopprUI.requireUser()) return '';
    const order = window.HopprState.activeDelivery;
    if (!order) return window.HopprUI.shell('Delivery Tracking', 'No active delivery order.', '<div class="empty-card"><strong>No active delivery</strong>Create a parcel or food order first.</div>');
    const steps = order.type === 'Food' ? ['Preparing Food', 'Driver Assigned', 'Picked Up', 'On the way', 'Delivered'] : ['Driver Assigned', 'Picked Up', 'On the way', 'Delivered'];
    const current = Math.max(0, steps.indexOf(order.status));
    return window.HopprUI.shell(order.type + ' Tracking', 'Track live delivery updates and confirmation code.',
      window.HopprUI.map(order.type + ' delivery route', order.from + ' → ' + order.to, order.from, order.to) +
      '<div class="summary-card">' +
        window.HopprUI.summaryLine('Order ID', order.id) +
        window.HopprUI.summaryLine('Tracking Code', String(order.code)) +
        window.HopprUI.summaryLine('Route', order.from + ' → ' + order.to) +
        window.HopprUI.summaryLine('Payment Method', order.paymentMethod || 'Cash after completion') +
        window.HopprUI.summaryLine('Delivery Fee', window.HopprUI.money(order.fee), 'total') +
      '</div>' +
      window.HopprUI.timeline(steps, current) +
      (order.status === 'Delivered'
        ? '<div class="summary-card"><h3 style="margin:0 0 8px;">Delivery Completed</h3><p style="margin:0 0 12px;color:var(--muted);">' +
            window.HopprUI.escape(isAfterCompletionPayment(order.paymentMethod || 'Cash after completion') ? 'Please proceed to payment using ' + (order.paymentMethod || 'Cash after completion') + '.' : 'Payment method selected before the order: ' + (order.paymentMethod || 'Cash after completion') + '.') +
          '</p><div class="button-row"><button id="deliveryPayment" class="primary-btn" type="button">Done</button></div></div>'
        : '<div class="button-row"><button id="nextDeliveryStatus" class="primary-btn" type="button">Next Status</button></div>')
    );
  }

  function bindDeliveryTracking() {
    const next = window.HopprUI.el('nextDeliveryStatus');
    if (next) next.addEventListener('click', function () {
      const order = window.HopprState.activeDelivery;
      const flow = order.type === 'Food' ? ['Preparing Food', 'Driver Assigned', 'Picked Up', 'On the way', 'Delivered'] : ['Driver Assigned', 'Picked Up', 'On the way', 'Delivered'];
      const index = Math.max(0, flow.indexOf(order.status));
      const nextIndex = Math.min(index + 1, flow.length - 1);
      order.status = flow[nextIndex];
      if (order.status === 'Delivered') {
        window.HopprState.rideHistory.unshift({ id: order.id, type: order.type, route: order.from + ' → ' + order.to, date: 'Today, just now', fare: order.fee, status: 'Delivered' });
        window.HopprUI.toast(order.type + ' order delivered successfully.', 'success');
      } else {
        window.HopprUI.toast('Delivery status updated: ' + order.status, 'success');
      }
      window.HopprRouter.go('deliveryTracking');
    });

    const payment = window.HopprUI.el('deliveryPayment');
    if (payment) payment.addEventListener('click', function () {
      const order = window.HopprState.activeDelivery;
      const method = order && order.paymentMethod ? order.paymentMethod : 'Cash after completion';
      window.HopprUI.toast('Delivery completed. Payment method: ' + method + '.', 'success');
      window.HopprRouter.go('history');
    });
  }

  window.HopprRouter.register('delivery', deliveryScreen);
  window.HopprRouter.register('deliveryTracking', deliveryTrackingScreen);
  window.HopprBinders.delivery = bindDelivery;
  window.HopprBinders.deliveryTracking = bindDeliveryTracking;
})();

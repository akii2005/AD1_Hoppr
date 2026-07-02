(function () {
  function ensureMessages() {
    if (!window.HopprState.aiMessages) {
      window.HopprState.aiMessages = [
        {
          role: 'assistant',
          text: 'Hi, I am Hoppr AI Assistant. I can recommend Ride, Parcel Delivery, Food Delivery, payment options, and safety tips for UTM campus services.'
        }
      ];
    }
    return window.HopprState.aiMessages;
  }

  function assistantScreen() {
    if (!window.HopprUI.requireUser()) return '';
    const messages = ensureMessages();
    return window.HopprUI.shell(
      'Hoppr AI Assistant',
      'Smart frontend assistant for service recommendation, fare guidance, payment support and safety tips.',
      '<div class="ai-status-card">' +
        '<div><strong>AI Assistant Mode</strong><span class="connected">Frontend simulated AI — works directly on GitHub Pages</span></div>' +
        '<span class="badge success">JavaScript AI Demo</span>' +
      '</div>' +
      '<div class="ai-chat-card" id="aiChat">' + renderMessages(messages) + '</div>' +
      '<div class="ai-quick-prompts">' +
        quickPrompt('I want to go from Kolej Tun Razak to Faculty of Computing') +
        quickPrompt('I want food delivery from ArkED Meranti') +
        quickPrompt('I need to send a parcel to UTM Library') +
        quickPrompt('Which payment method should I use?') +
        quickPrompt('Give me safety tips for a night ride') +
      '</div>' +
      '<form id="aiAssistantForm" class="form-card ai-form">' +
        window.HopprUI.textArea('aiMessage', 'Ask Hoppr AI', '', 'Example: I want a ride from KTR to Faculty of Computing') +
        '<button class="primary-btn" type="submit">Ask AI Assistant</button>' +
      '</form>'
    );
  }

  function quickPrompt(text) {
    return '<button type="button" class="ai-prompt" data-ai-prompt="' + window.HopprUI.escape(text) + '">' + window.HopprUI.escape(text) + '</button>';
  }

  function renderMessages(messages) {
    return messages.map(function (message) {
      return '<div class="ai-message ' + message.role + '">' +
        '<div class="ai-avatar">' + (message.role === 'user' ? '👤' : '🤖') + '</div>' +
        '<div class="ai-bubble">' + formatResponse(message.text) + '</div>' +
      '</div>';
    }).join('');
  }

  function formatResponse(text) {
    const safe = window.HopprUI.escape(text || '');
    return safe
      .replace(/\n- /g, '<br>• ')
      .replace(/\n/g, '<br>');
  }

  function bindAssistant() {
    window.HopprUI.qsa('[data-ai-prompt]').forEach(function (button) {
      button.addEventListener('click', function () {
        const text = button.getAttribute('data-ai-prompt');
        const field = window.HopprUI.el('aiMessage');
        if (field) field.value = text;
        sendAssistantMessage(text);
      });
    });

    const form = window.HopprUI.el('aiAssistantForm');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        const field = window.HopprUI.el('aiMessage');
        const text = field ? field.value.trim() : '';
        if (!text) {
          window.HopprUI.toast('Please type a question for Hoppr AI.', 'warning');
          return;
        }
        if (field) field.value = '';
        sendAssistantMessage(text);
      });
    }
  }

  function appendMessage(role, text) {
    const messages = ensureMessages();
    messages.push({ role: role, text: text });
    const chat = window.HopprUI.el('aiChat');
    if (chat) {
      chat.innerHTML = renderMessages(messages);
      chat.scrollTop = chat.scrollHeight;
    }
  }

  function sendAssistantMessage(text) {
    appendMessage('user', text);
    appendMessage('assistant', smartReply(text));
  }

  function findLocations(message) {
    const lower = message.toLowerCase();
    const found = [];
    window.HopprData.locations.forEach(function (location) {
      if (lower.indexOf(location.toLowerCase()) >= 0) found.push(location);
    });

    const aliases = [
      ['ktr', 'Kolej Tun Razak'],
      ['krp', 'Kolej Rahman Putra'],
      ['ktc', 'Kolej Tuanku Canselor'],
      ['fc', 'Faculty of Computing'],
      ['computing', 'Faculty of Computing'],
      ['library', 'UTM Library'],
      ['arked', 'ArkED Meranti Food Court'],
      ['meranti', 'ArkED Meranti Food Court'],
      ['health', 'UTM Health Centre'],
      ['sports', 'Sports Centre']
    ];

    aliases.forEach(function (pair) {
      const key = pair[0];
      const value = pair[1];
      const regex = new RegExp('\\b' + key + '\\b', 'i');
      if (regex.test(message) && found.indexOf(value) === -1) found.push(value);
    });

    return found.slice(0, 2);
  }

  function estimateFare(from, to) {
    const locations = window.HopprData.locations;
    const start = Math.max(0, locations.indexOf(from));
    const end = Math.max(0, locations.indexOf(to));
    const distance = from && to && from !== to ? 1.4 + Math.abs(start - end) * 0.28 : 2.0;
    const minutes = Math.ceil(distance * 4 + 2);
    const fare = Math.max(3.2, 2.5 + minutes * 0.22);
    return {
      distance: distance.toFixed(1) + ' km',
      eta: minutes + ' min',
      fare: window.HopprUI.money(fare)
    };
  }

  function smartReply(message) {
    const lower = message.toLowerCase();
    const places = findLocations(message);
    const from = places[0] || 'Kolej Tun Razak';
    const to = places[1] || 'Faculty of Computing';
    const estimate = estimateFare(from, to);
    const role = window.HopprState.activeUser ? window.HopprState.activeUser.role : 'verified UTM user';

    const wantsFood = /food|eat|meal|nasi|drink|vendor|cafe|restaurant/.test(lower);
    const wantsParcel = /parcel|package|document|send|deliver item|drop.*item/.test(lower);
    const wantsPayment = /pay|payment|cash|qr|card|visa|mastercard/.test(lower);
    const wantsSafety = /safe|safety|night|trust|security|late/.test(lower);
    const wantsDriver = /driver|job|earning|accept|complete trip/.test(lower);
    const wantsAdmin = /admin|monitor|report|verify|suspend/.test(lower);

    if (wantsPayment) {
      return 'Payment guidance for ' + role + ':\n- Choose payment method while entering ride or delivery details.\n- Cash after completion is simple for in-person payment.\n- QR Pay after completion is faster for confirmation.\n- Saved bank cards are useful when the user wants the method recorded before service starts.';
    }

    if (wantsSafety) {
      return 'Hoppr safety tips:\n- Use verified UTM accounts only.\n- Check route and driver status before starting.\n- For night rides, choose visible pickup points.\n- Keep service and payment records inside Hoppr for accountability.';
    }

    if (wantsFood) {
      return 'Recommended service: Food Delivery.\nSuggested route: ArkED Meranti Food Court → ' + to + '.\nEstimated delivery fee: ' + estimate.fare + '.\nSuggested flow:\n- Open Delivery Services.\n- Choose Food tab.\n- Select campus vendor, order details, location and payment method.\n- Submit and track delivery status.';
    }

    if (wantsParcel) {
      return 'Recommended service: Parcel Delivery.\nSuggested route: ' + from + ' → ' + to + '.\nEstimated delivery fee: ' + estimate.fare + '.\nSuggested flow:\n- Open Delivery Services.\n- Choose Parcel tab.\n- Enter pickup, drop-off, parcel details and payment method.\n- Submit to generate a tracking code.';
    }

    if (wantsDriver) {
      return 'Driver assistant:\n- Open Driver Jobs.\n- Review available ride, parcel and food jobs.\n- Accept suitable jobs based on distance and fare.\n- Complete trips to update earnings history.';
    }

    if (wantsAdmin) {
      return 'Admin assistant:\n- Open Admin Monitor.\n- Review users, rides, deliveries and reports.\n- Focus on delayed jobs, account verification and suspicious activity.\n- This supports a safer UTM-only service environment.';
    }

    return 'Recommended service: Ride Booking.\nSuggested route: ' + from + ' → ' + to + '.\nEstimated distance: ' + estimate.distance + '.\nEstimated ETA: ' + estimate.eta + '.\nEstimated fare: ' + estimate.fare + '.\nSuggested payment: Cash or QR Pay after completion.\nNext steps:\n- Open Ride Booking.\n- Select pickup, destination, vehicle type, tier and payment method.\n- Submit the request.\n- Track the driver when status reaches Driver Arriving.';
  }

  window.HopprRouter.register('assistant', assistantScreen);
  window.HopprBinders.assistant = bindAssistant;
})();

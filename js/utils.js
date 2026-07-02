(function () {
  const state = {
    currentRoute: 'home',
    previousRoute: 'home',
    pendingRoute: null,
    activeUser: null,
    darkMode: false,
    notificationsEnabled: true,
    driverOnline: true,
    activeRide: null,
    activeDelivery: null,
    rideHistory: [
      { id: 'R-0902', type: 'Ride', route: 'Kolej Tun Razak → UTM Library', date: 'Today, 10:10 AM', fare: 3.90, status: 'Completed' },
      { id: 'F-0815', type: 'Food', route: 'ArkED Meranti → Faculty of Computing', date: 'Yesterday, 7:45 PM', fare: 5.20, status: 'Delivered' }
    ],
    deliveryOrders: [],
    driverJobs: JSON.parse(JSON.stringify(window.HopprData.sampleJobs)),
    acceptedJobs: [],
    adminUsers: JSON.parse(JSON.stringify(window.HopprData.users)),
    adminComplaints: JSON.parse(JSON.stringify(window.HopprData.complaints)),
    selectedComplaintId: null,
    notifications: [
      'Welcome to Hoppr verified campus services.',
      'Prototype includes ride, parcel, food, driver and admin flows.'
    ]
  };

  const routeMeta = {
    home: ['Welcome', 'Campus verified rides'],
    auth: ['Account Access', 'Login, sign up and verification'],
    ride: ['Ride Booking', 'Request and track rides'],
    payment: ['Payment', 'Fare summary and confirmation'],
    rideTracking: ['Live Ride', 'Driver GPS and trip status'],
    delivery: ['Delivery Services', 'Parcel and food management'],
    deliveryTracking: ['Delivery Tracking', 'Live order status'],
    driver: ['Driver Dashboard', 'Accept, decline and complete jobs'],
    profile: ['Profile & Settings', 'Manage account details'],
    admin: ['Admin Monitor', 'Verify users and monitor activity'],
    history: ['History', 'Completed services and payment records'],
    assistant: ['Hoppr AI', 'Smart service assistant']
  };

  const routeRules = {
    home: { public: true },
    auth: { public: true },
    ride: { roles: ['Student Passenger'] },
    rideTracking: { roles: ['Student Passenger'] },
    payment: { roles: ['Student Passenger'] },
    delivery: { roles: ['Student Passenger'] },
    deliveryTracking: { roles: ['Student Passenger'] },
    history: { roles: ['Student Passenger', 'Student Driver'] },
    driver: { roles: ['Student Driver'] },
    admin: { roles: ['Admin'] },
    profile: { roles: ['Student Passenger', 'Student Driver', 'Admin'] },
    assistant: { roles: ['Student Passenger', 'Student Driver', 'Admin'] }
  };

  function el(id) { return document.getElementById(id); }
  function qs(selector, root) { return (root || document).querySelector(selector); }
  function qsa(selector, root) { return Array.from((root || document).querySelectorAll(selector)); }
  function money(value) { return 'RM ' + Number(value || 0).toFixed(2); }
  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function createId(prefix) { return prefix + '-' + Math.floor(1000 + Math.random() * 9000); }
  function validUtmEmail(email) { return /@(student\.utm\.my|graduate\.utm\.my|utm\.my)$/i.test(String(email || '').trim()); }
  function isRole(role) { return state.activeUser && state.activeUser.role === role; }
  function isStudent() { return isRole('Student Passenger'); }
  function isDriver() { return isRole('Student Driver'); }
  function isAdmin() { return isRole('Admin'); }

  function setTitle(route) {
    const meta = routeMeta[route] || routeMeta.home;
    const title = el('screenTitle');
    const caption = el('screenCaption');
    if (title) title.textContent = meta[0];
    if (caption) caption.textContent = meta[1];
  }

  function toast(message, type) {
    const box = el('toast');
    if (!box) return;
    box.className = 'toast ' + (type || '');
    box.textContent = message;
    box.classList.add('show');
    clearTimeout(window.HopprToastTimer);
    window.HopprToastTimer = setTimeout(function () { box.classList.remove('show'); }, 2800);
  }

  function input(id, label, type, value, placeholder) {
    return '<div class="input-group"><label for="' + id + '">' + escapeHTML(label) + '</label>' +
      '<input id="' + id + '" type="' + (type || 'text') + '" value="' + escapeHTML(value || '') + '" placeholder="' + escapeHTML(placeholder || '') + '"></div>';
  }
  function textArea(id, label, value, placeholder) {
    return '<div class="input-group"><label for="' + id + '">' + escapeHTML(label) + '</label>' +
      '<textarea id="' + id + '" placeholder="' + escapeHTML(placeholder || '') + '">' + escapeHTML(value || '') + '</textarea></div>';
  }
  function select(id, label, items, selected) {
    return '<div class="input-group"><label for="' + id + '">' + escapeHTML(label) + '</label><select id="' + id + '">' +
      items.map(function (item) {
        const value = typeof item === 'string' ? item : item.id;
        const text = typeof item === 'string' ? item : item.label;
        const isSelected = selected === value || selected === text ? ' selected' : '';
        return '<option value="' + escapeHTML(value) + '"' + isSelected + '>' + escapeHTML(text) + '</option>';
      }).join('') + '</select></div>';
  }
  function summaryLine(label, value, className) {
    return '<div class="summary-line ' + (className || '') + '"><span>' + escapeHTML(label) + '</span><strong>' + escapeHTML(value) + '</strong></div>';
  }
  function timeline(steps, current) {
    return '<div class="timeline-card"><div class="timeline">' + steps.map(function (step, index) {
      const stateClass = index < current ? 'done' : (index === current ? 'current' : '');
      const statusText = index < current ? 'Done' : (index === current ? 'Current status' : 'Waiting');
      return '<div class="timeline-step ' + stateClass + '"><div class="step-dot">' + (index < current ? '✓' : index + 1) + '</div>' +
        '<div class="step-content"><strong>' + escapeHTML(step) + '</strong><span>' + statusText + '</span></div></div>';
    }).join('') + '</div></div>';
  }

  function getPlace(name) {
    return window.HopprData.campusPlaces[name] || { x: 50, y: 50, short: name || 'UTM' };
  }
  function map(title, label, from, to) {
    const startName = from || 'Kolej Tun Razak';
    const endName = to || 'Faculty of Computing';
    const start = getPlace(startName);
    const end = getPlace(endName);
    const driverX = Math.round((start.x + end.x) / 2);
    const driverY = Math.round((start.y + end.y) / 2 - 6);
    const svgPath = 'M ' + start.x + ' ' + start.y + ' C ' + (start.x + 10) + ' ' + (start.y - 28) + ', ' + (end.x - 18) + ' ' + (end.y + 22) + ', ' + end.x + ' ' + end.y;
    return '<div class="map-card">' +
      '<div class="map-toolbar"><strong>' + escapeHTML(title || 'UTM campus map') + '</strong><span class="badge success">UTM Map</span></div>' +
      '<div class="campus-map" aria-label="UTM campus map route prototype">' +
        '<div class="map-road r1"></div><div class="map-road r2"></div><div class="map-road r3"></div>' +
        '<svg class="route-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="' + svgPath + '"></path></svg>' +
        placeMarkup(startName, start, 'start') + placeMarkup(endName, end, 'end') + placeMarkup('Driver', { x: driverX, y: driverY, short: 'Driver' }, 'driver') +
        '<div class="map-label">' + escapeHTML(label || (startName + ' → ' + endName)) + '</div>' +
      '</div></div>';
  }
  function placeMarkup(name, place, type) {
    return '<div class="map-place ' + type + '" style="left:' + place.x + '%;top:' + place.y + '%;"><div class="place-dot"></div><span>' + escapeHTML(place.short || name) + '</span></div>';
  }
  function exampleRoutes(limit) {
    return '<div class="example-routes">' + window.HopprData.exampleRoutes.slice(0, limit || 4).map(function (route) {
      return '<button type="button" class="route-example" data-example-route="' + escapeHTML(route.id) + '">' +
        '<strong>' + escapeHTML(route.name) + '</strong>' +
        '<div class="route-meta"><span>' + escapeHTML(route.distance) + '</span><span>' + escapeHTML(route.eta) + '</span><span>' + money(route.fare) + '</span></div>' +
      '</button>';
    }).join('') + '</div>';
  }

  function shell(title, subtitle, content) {
    return '<div class="stack"><div class="hero-card"><h2>' + escapeHTML(title) + '</h2><p>' + escapeHTML(subtitle) + '</p></div>' + content + '</div>';
  }

  function navigationItems() {
    if (!state.activeUser) {
      return [
        { route: 'home', label: 'Welcome', shortLabel: 'Welcome', icon: '⌂', public: true },
        { route: 'ride', label: 'Ride Booking', shortLabel: 'Ride', icon: '⌖', locked: true },
        { route: 'delivery', label: 'Delivery Services', shortLabel: 'Delivery', icon: '▣', locked: true },
        { route: 'assistant', label: 'AI Assistant', shortLabel: 'AI', icon: '🤖', locked: true },
        { route: 'driver', label: 'Driver Mode', shortLabel: 'Driver', icon: '♢', locked: true },
        { route: 'admin', label: 'Admin Monitor', shortLabel: 'Admin', icon: '◆', locked: true }
      ];
    }
    if (isStudent()) {
      return [
        { route: 'home', label: 'Home', shortLabel: 'Home', icon: '⌂' },
        { route: 'ride', label: 'Ride', shortLabel: 'Ride', icon: '⌖' },
        { route: 'delivery', label: 'Delivery', shortLabel: 'Delivery', icon: '▣' },
        { route: 'assistant', label: 'AI Assistant', shortLabel: 'AI', icon: '🤖' },
        { route: 'history', label: 'History', shortLabel: 'History', icon: '◷' },
        { route: 'profile', label: 'Profile', shortLabel: 'Profile', icon: '◉' }
      ];
    }
    if (isDriver()) {
      return [
        { route: 'home', label: 'Home', shortLabel: 'Home', icon: '⌂' },
        { route: 'driver', label: 'Jobs', shortLabel: 'Jobs', icon: '♢' },
        { route: 'assistant', label: 'AI Assistant', shortLabel: 'AI', icon: '🤖' },
        { route: 'history', label: 'Earnings', shortLabel: 'Earnings', icon: 'RM' },
        { route: 'profile', label: 'Profile', shortLabel: 'Profile', icon: '◉' }
      ];
    }
    return [
      { route: 'home', label: 'Home', shortLabel: 'Home', icon: '⌂' },
      { route: 'admin', label: 'Monitor', shortLabel: 'Monitor', icon: '◆' },
      { route: 'assistant', label: 'AI Assistant', shortLabel: 'AI', icon: '🤖' },
      { route: 'profile', label: 'Profile', shortLabel: 'Profile', icon: '◉' }
    ];
  }


  function navIcon(route) {
    const icons = {
      home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5L12 4l9 7.5"></path><path d="M5.5 10.5V20h13v-9.5"></path><path d="M9.5 20v-5h5v5"></path></svg>',
      ride: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16h14"></path><path d="M6.5 16l1.3-5.2A3 3 0 0 1 10.7 8h2.6a3 3 0 0 1 2.9 2.8L17.5 16"></path><path d="M7 16v2"></path><path d="M17 16v2"></path><circle cx="8" cy="18" r="1.6"></circle><circle cx="16" cy="18" r="1.6"></circle></svg>',
      delivery: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5l8-4 8 4-8 4-8-4z"></path><path d="M4 7.5v9l8 4 8-4v-9"></path><path d="M12 11.5v9"></path></svg>',
      assistant: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="7" width="14" height="11" rx="3"></rect><path d="M9 7V4"></path><path d="M15 7V4"></path><circle cx="9.5" cy="12.5" r="1"></circle><circle cx="14.5" cy="12.5" r="1"></circle><path d="M9 16h6"></path><path d="M3.5 11v4"></path><path d="M20.5 11v4"></path></svg>',
      driver: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="2"></circle><path d="M12 14v6"></path><path d="M10.5 10.5L5 8.5"></path><path d="M13.5 10.5L19 8.5"></path></svg>',
      admin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3z"></path><path d="M9 12l2 2 4-4"></path></svg>',
      history: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 7v5l3 2"></path><path d="M4 12H2"></path></svg>',
      profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 20a6.5 6.5 0 0 1 13 0"></path></svg>'
    };
    return icons[route] || '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"></circle></svg>';
  }

  function renderNavigation(activeRoute) {
    const side = el('sideNav');
    const tabs = el('tabBar');
    const items = navigationItems();
    if (side) {
      side.innerHTML = items.map(function (item) {
        return '<button type="button" data-route="' + item.route + '" class="nav-button ' + (item.locked ? 'locked ' : '') + (item.route === activeRoute ? 'active' : '') + '">' + escapeHTML(item.label) + '</button>';
      }).join('');
    }
    if (tabs) {
      tabs.style.gridTemplateColumns = 'repeat(' + items.length + ', 1fr)';
      tabs.innerHTML = items.map(function (item) {
        const tabLabel = item.shortLabel || item.label;
        return '<button type="button" data-route="' + item.route + '" class="tab ' + (item.locked ? 'locked ' : '') + (item.route === activeRoute ? 'active' : '') + '">' +
          '<span class="tab-icon">' + navIcon(item.route) + '</span>' +
          '<span class="tab-label">' + escapeHTML(tabLabel) + '</span>' +
        '</button>';
      }).join('');
    }
  }

  function canAccess(route) {
    const rule = routeRules[route] || { public: false };
    if (rule.public) return true;
    if (!state.activeUser) return false;
    if (!rule.roles) return true;
    return rule.roles.indexOf(state.activeUser.role) >= 0;
  }
  function showAuthModal(route) {
    state.pendingRoute = route || 'home';
    const modal = el('authModal');
    if (modal) {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
    }
  }
  function hideAuthModal() {
    const modal = el('authModal');
    if (modal) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    }
  }
  function requireUser(route) {
    if (!state.activeUser) {
      showAuthModal(route || state.currentRoute);
      return false;
    }
    return true;
  }
  function roleDenied(route) {
    const allowed = (routeRules[route] && routeRules[route].roles || []).join(', ');
    toast('This screen is not available for your role. Allowed: ' + allowed, 'warning');
  }

  window.HopprState = state;
  window.HopprUI = {
    el, qs, qsa, money, escape: escapeHTML, createId, validUtmEmail, setTitle, toast,
    input, textArea, select, summaryLine, timeline, map, exampleRoutes, shell,
    isStudent, isDriver, isAdmin, canAccess, showAuthModal, hideAuthModal, requireUser,
    roleDenied, renderNavigation
  };
})();

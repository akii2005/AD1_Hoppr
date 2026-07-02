(function () {
  function homeScreen() {
    if (!window.HopprState.activeUser) return publicWelcome();
    const user = window.HopprState.activeUser;
    if (window.HopprUI.isDriver()) return driverHome(user);
    if (window.HopprUI.isAdmin()) return adminHome(user);
    return studentHome(user);
  }

  function publicWelcome() {
    return '<div class="stack">' +
      '<div class="welcome-card">' +
        '<img src="assets/logo.svg" alt="Hoppr logo" class="welcome-logo">' +
        '<h2>Welcome to Hoppr</h2>' +
        '<p>A UTM-only ride hailing and delivery prototype for verified students, student drivers and admin supervisors.</p>' +
        '<div class="role-chip-row"><span class="role-chip">Student rides</span><span class="role-chip">Parcel delivery</span><span class="role-chip">Food delivery</span><span class="role-chip">Driver jobs</span><span class="role-chip">AI assistant</span></div>' +
        '<div class="button-row"><button class="primary-btn" type="button" data-route="auth" data-auth-mode="login">Log In</button><button class="secondary-btn" type="button" data-route="auth" data-auth-mode="register">Sign Up</button></div>' +
      '</div>' +
      window.HopprUI.map('UTM Campus Service Map', 'Example route: Kolej Tun Razak → Faculty of Computing', 'Kolej Tun Razak', 'Faculty of Computing') +
      '<h3 class="section-title">Example UTM Routes</h3>' + window.HopprUI.exampleRoutes(4) +
      '<div class="auth-prompt"><div class="modal-icon">🔐</div><strong>Protected prototype</strong><p class="help-text">Try pressing Ride, Delivery, Driver or Admin before logging in. A sign-in prompt will appear.</p></div>' +
    '</div>';
  }

  function studentHome(user) {
    const activeRide = window.HopprState.activeRide;
    const delivery = window.HopprState.activeDelivery;
    return '<div class="stack">' +
      '<div class="hero-card"><h2>Hi, ' + window.HopprUI.escape(user.name.split(' ')[0]) + '</h2><p>Book campus rides, parcel delivery and food delivery using your verified UTM student account.</p><div class="hero-actions"><button class="secondary-btn" type="button" data-route="ride">Book Ride</button><button class="secondary-btn" type="button" data-route="delivery">Delivery</button></div></div>' +
      '<div class="grid-3">' +
        metric('Role', 'Student', 'Passenger account') +
        metric('Active Ride', activeRide ? '1' : '0', activeRide ? activeRide.status : 'No active trip') +
        metric('Delivery', delivery ? '1' : '0', delivery ? delivery.status : 'No active order') +
      '</div>' +
      window.HopprUI.map('UTM Student Route Map', 'Live route preview for ride and delivery booking', 'Kolej Tun Razak', 'Faculty of Computing') +
      '<h3 class="section-title">Campus Services</h3>' +
      '<div class="grid-2">' +
        serviceCard('ride', '🚕', 'Ride Booking', 'Request a campus ride, view fare, track driver and pay.') +
        serviceCard('delivery', '📦', 'Delivery Services', 'Book parcel or food delivery with live status updates.') +
        serviceCard('assistant', '🤖', 'Hoppr AI Assistant', 'Ask for ride, delivery, fare, payment and safety guidance.') +
        serviceCard('history', '◷', 'History & Payment', 'Review completed bookings and fare records.') +
        serviceCard('profile', '◉', 'Profile & Settings', 'Update phone, faculty, theme and notifications.') +
      '</div>' +
      '<h3 class="section-title">Notifications</h3>' + notificationList() +
    '</div>';
  }

  function driverHome(user) {
    return '<div class="stack">' +
      '<div class="hero-card"><h2>Driver mode</h2><p>Welcome ' + window.HopprUI.escape(user.name.split(' ')[0]) + '. Accept ride, parcel and food jobs from nearby students.</p><div class="hero-actions"><button class="secondary-btn" type="button" data-route="driver">View Jobs</button><button class="secondary-btn" type="button" data-route="history">Earnings</button></div></div>' +
      '<div class="grid-3">' +
        metric('Availability', window.HopprState.driverOnline ? 'Online' : 'Offline', 'Student driver') +
        metric('Waiting Jobs', String(window.HopprState.driverJobs.length), 'Ride / parcel / food') +
        metric('Accepted', String(window.HopprState.acceptedJobs.length), 'Trip execution') +
      '</div>' +
      window.HopprUI.map('Nearby Job Broadcast Map', 'Sample job: UTM Library → Kolej Rahman Putra', 'UTM Library', 'Kolej Rahman Putra') +
      '<h3 class="section-title">Driver Shortcuts</h3>' +
      '<div class="grid-2">' +
        serviceCard('driver', '♢', 'Driver Dashboard', 'Go online, accept or decline jobs and complete trips.') +
        serviceCard('history', 'RM', 'Earnings Summary', 'Review completed services and payment records.') +
        serviceCard('profile', '◉', 'Driver Profile', 'Manage account and vehicle details.') +
      '</div>' + notificationList() +
    '</div>';
  }

  function adminHome(user) {
    return '<div class="stack">' +
      '<div class="hero-card"><h2>Admin monitor</h2><p>Welcome ' + window.HopprUI.escape(user.name.split(' ')[0]) + '. Verify users, monitor activities and handle reports.</p><div class="hero-actions"><button class="secondary-btn" type="button" data-route="admin">Open Admin Monitor</button></div></div>' +
      '<div class="grid-3">' +
        metric('Users', String(window.HopprState.adminUsers.length), 'Registered accounts') +
        metric('Reports', String(window.HopprData.complaints.length), 'Complaints') +
        metric('Status', 'Live', 'Monitoring') +
      '</div>' +
      window.HopprUI.map('UTM Activity Monitoring Map', 'Admin overview for ride and delivery activity', 'Dewan Sultan Iskandar', 'Faculty of Computing') +
      '<h3 class="section-title">Admin Shortcuts</h3>' +
      '<div class="grid-2">' + serviceCard('admin', '◆', 'Admin Monitor', 'Verify accounts, monitor jobs and handle complaints.') + serviceCard('profile', '◉', 'Profile', 'Manage admin account settings.') + '</div>' +
    '</div>';
  }

  function metric(label, value, note) {
    return '<div class="metric-card"><span>' + window.HopprUI.escape(label) + '</span><strong style="font-size:18px;">' + window.HopprUI.escape(value) + '</strong><small>' + window.HopprUI.escape(note) + '</small></div>';
  }
  function serviceCard(route, icon, title, description) {
    return '<button class="service-card" type="button" data-route="' + route + '"><span class="icon">' + icon + '</span><h3>' + window.HopprUI.escape(title) + '</h3><p>' + window.HopprUI.escape(description) + '</p></button>';
  }
  function notificationList() {
    return '<div class="list-card">' + window.HopprState.notifications.slice(0, 4).map(function (note, index) {
      return '<div class="list-row"><div class="row-icon">' + (index + 1) + '</div><div class="row-main"><strong>In-app alert</strong><span>' + window.HopprUI.escape(note) + '</span></div><span class="badge success">New</span></div>';
    }).join('') + '</div>';
  }

  function bindGlobalNavigation() {
    document.addEventListener('click', function (event) {
      const routeExample = event.target.closest('[data-example-route]');
      if (routeExample && window.HopprState.currentRoute !== 'ride') {
        event.preventDefault();
        const routeId = routeExample.getAttribute('data-example-route');
        if (!window.HopprState.activeUser) {
          window.HopprUI.showAuthModal('ride');
        } else if (!window.HopprUI.isStudent()) {
          window.HopprUI.roleDenied('ride');
        } else {
          window.HopprRouter.go('ride', { exampleRoute: routeId });
        }
        return;
      }
      const demo = event.target.closest('[data-demo-email]');
      if (demo && !demo.closest('#app')) {
        event.preventDefault();
        window.HopprRouter.go('auth', { mode: 'login', demoEmail: demo.getAttribute('data-demo-email') });
        return;
      }
      const target = event.target.closest('[data-route]');
      if (!target) return;
      const route = target.getAttribute('data-route');
      if (route === 'auth') {
        const mode = target.getAttribute('data-auth-mode') || 'login';
        window.HopprRouter.go('auth', { mode: mode });
      } else if (route) {
        window.HopprRouter.go(route);
      }
    });

    const backButton = window.HopprUI.el('backButton');
    if (backButton) backButton.addEventListener('click', function () { window.HopprRouter.back(); });

    const themeButton = window.HopprUI.el('themeButton');
    if (themeButton) themeButton.addEventListener('click', function () {
      window.HopprState.darkMode = !window.HopprState.darkMode;
      document.body.classList.toggle('dark', window.HopprState.darkMode);
      themeButton.textContent = window.HopprState.darkMode ? '☀' : '☾';
      window.HopprUI.toast('Theme changed.', 'success');
    });

    const modalLogin = window.HopprUI.el('modalLogin');
    const modalSignup = window.HopprUI.el('modalSignup');
    const modalHome = window.HopprUI.el('modalHome');
    if (modalLogin) modalLogin.addEventListener('click', function () { window.HopprUI.hideAuthModal(); window.HopprRouter.go('auth', { mode: 'login' }); });
    if (modalSignup) modalSignup.addEventListener('click', function () { window.HopprUI.hideAuthModal(); window.HopprRouter.go('auth', { mode: 'register' }); });
    if (modalHome) modalHome.addEventListener('click', function () { window.HopprUI.hideAuthModal(); window.HopprRouter.go('home'); });
  }

  function init() {
    window.HopprRouter.register('home', homeScreen);
    bindGlobalNavigation();
    window.HopprRouter.go('home');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

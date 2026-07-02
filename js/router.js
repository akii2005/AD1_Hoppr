(function () {
  const routes = {};

  function register(name, renderer) {
    routes[name] = renderer;
  }

  function go(route, params) {
    const renderer = routes[route];
    if (!renderer) {
      window.HopprUI.toast('Screen not found: ' + route, 'danger');
      return;
    }
    if (!window.HopprUI.canAccess(route)) {
      if (!window.HopprState.activeUser) {
        window.HopprUI.showAuthModal(route);
      } else {
        window.HopprUI.roleDenied(route);
        route = 'home';
      }
    }
    const finalRenderer = routes[route];
    window.HopprState.previousRoute = window.HopprState.currentRoute;
    window.HopprState.currentRoute = route;
    window.HopprUI.setTitle(route);
    window.HopprUI.el('app').innerHTML = finalRenderer(params || {});
    window.HopprUI.renderNavigation(route);
    if (typeof window.HopprBinders[route] === 'function') {
      window.HopprBinders[route](params || {});
    }
  }

  function back() {
    const previous = window.HopprState.previousRoute || 'home';
    if (previous === window.HopprState.currentRoute) go('home');
    else go(previous);
  }

  window.HopprBinders = {};
  window.HopprRouter = { register, go, back };
})();

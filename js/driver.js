(function () {
  function driverScreen() {
    if (!window.HopprUI.requireUser()) return '';
    const onlineText = window.HopprState.driverOnline ? 'Online' : 'Offline';
    const jobs = window.HopprState.driverJobs;
    const accepted = window.HopprState.acceptedJobs;
    return window.HopprUI.shell('Driver Management', 'Toggle availability, view nearby jobs, accept or decline requests, complete trips and view earnings.',
      '<div class="grid-2">' +
        '<div class="metric-card"><span>Availability</span><strong>' + onlineText + '</strong><small>Student driver mode</small></div>' +
        '<div class="metric-card"><span>Total Earnings</span><strong>' + window.HopprUI.money(totalEarnings()) + '</strong><small>Prototype summary</small></div>' +
      '</div>' +
      '<div class="form-card"><div class="toggle-row"><div><strong>Go Online / Offline</strong><p class="help-text">When online, ride, parcel and food jobs are visible.</p></div><button type="button" id="driverOnlineToggle" class="switch ' + (window.HopprState.driverOnline ? 'on' : '') + '" aria-label="Toggle driver availability"></button></div></div>' +
      '<h3 class="section-title">Available Jobs</h3>' + jobList(jobs, 'available') +
      '<h3 class="section-title">Accepted Trips</h3>' + (accepted.length ? jobList(accepted, 'accepted') : '<div class="empty-card"><strong>No accepted trips</strong>Accept a job to move it to trip execution.</div>')
    );
  }

  function totalEarnings() {
    return window.HopprState.acceptedJobs.filter(function (job) { return job.status === 'Completed'; }).reduce(function (sum, job) { return sum + Number(job.fare || 0); }, 0);
  }

  function jobList(jobs, mode) {
    if (!window.HopprState.driverOnline && mode === 'available') {
      return '<div class="empty-card"><strong>Driver is offline</strong>Go online to receive nearby jobs from Socket.IO live broadcast.</div>';
    }
    if (!jobs.length) {
      return '<div class="empty-card"><strong>No jobs available</strong>New passenger requests will appear here.</div>';
    }
    return '<div class="list-card">' + jobs.map(function (job) {
      const actions = mode === 'available'
        ? '<div class="button-row" style="grid-column:1 / -1;"><button type="button" class="secondary-btn accept-job" data-id="' + job.id + '">Accept</button><button type="button" class="danger-btn decline-job" data-id="' + job.id + '">Decline</button></div>'
        : '<div class="button-row" style="grid-column:1 / -1;"><button type="button" class="primary-btn complete-job" data-id="' + job.id + '">Complete Trip</button></div>';
      return '<div class="list-row" style="grid-template-columns:42px 1fr auto;align-items:start;">' +
        '<div class="row-icon">' + iconFor(job.type) + '</div>' +
        '<div class="row-main"><strong>' + window.HopprUI.escape(job.id) + ' · ' + window.HopprUI.escape(job.type) + '</strong><span>Passenger: ' + window.HopprUI.escape(job.passenger) + '<br>' + window.HopprUI.escape(job.pickup) + ' → ' + window.HopprUI.escape(job.dropoff) + '<br>' + window.HopprUI.escape(job.distance) + ' · ETA ' + window.HopprUI.escape(job.eta) + '</span></div>' +
        '<span class="badge ' + (job.status === 'Completed' ? 'success' : 'warning') + '">' + window.HopprUI.escape(job.status) + '</span>' + actions + '</div>';
    }).join('') + '</div>';
  }

  function iconFor(type) {
    if (type === 'Ride') return '🚕';
    if (type === 'Parcel') return '📦';
    return '🍱';
  }

  function bindDriver() {
    const toggle = window.HopprUI.el('driverOnlineToggle');
    if (toggle) toggle.addEventListener('click', function () {
      window.HopprState.driverOnline = !window.HopprState.driverOnline;
      window.HopprUI.toast('Driver is now ' + (window.HopprState.driverOnline ? 'online' : 'offline') + '.', 'success');
      window.HopprRouter.go('driver');
    });
    window.HopprUI.qsa('.accept-job').forEach(function (button) {
      button.addEventListener('click', function () {
        const id = button.getAttribute('data-id');
        const index = window.HopprState.driverJobs.findIndex(function (job) { return job.id === id; });
        if (index >= 0) {
          const job = window.HopprState.driverJobs.splice(index, 1)[0];
          job.status = 'Accepted';
          window.HopprState.acceptedJobs.unshift(job);
          window.HopprState.notifications.unshift('Driver accepted job ' + job.id + '.');
          window.HopprUI.toast('Job accepted and moved to trip execution.', 'success');
          window.HopprRouter.go('driver');
        }
      });
    });
    window.HopprUI.qsa('.decline-job').forEach(function (button) {
      button.addEventListener('click', function () {
        const id = button.getAttribute('data-id');
        window.HopprState.driverJobs = window.HopprState.driverJobs.filter(function (job) { return job.id !== id; });
        window.HopprUI.toast('Job declined.', 'warning');
        window.HopprRouter.go('driver');
      });
    });
    window.HopprUI.qsa('.complete-job').forEach(function (button) {
      button.addEventListener('click', function () {
        const id = button.getAttribute('data-id');
        const job = window.HopprState.acceptedJobs.find(function (item) { return item.id === id; });
        if (job) {
          job.status = 'Completed';
          window.HopprState.rideHistory.unshift({ id: job.id, type: job.type, route: job.pickup + ' → ' + job.dropoff, date: 'Today, just now', fare: job.fare, status: 'Completed' });
          window.HopprUI.toast('Trip completed and earnings updated.', 'success');
          window.HopprRouter.go('driver');
        }
      });
    });
  }

  window.HopprRouter.register('driver', driverScreen);
  window.HopprBinders.driver = bindDriver;
})();

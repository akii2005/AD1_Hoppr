(function () {
  function adminScreen() {
    if (!window.HopprUI.requireUser()) return '';

    const activeRides = (window.HopprState.activeRide ? 1 : 0) + window.HopprState.deliveryOrders.filter(function (o) { return o.status !== 'Delivered'; }).length;
    const complaints = getComplaints();
    const openCount = complaints.filter(function (c) { return c.status === 'Open'; }).length;
    const reviewingCount = complaints.filter(function (c) { return c.status === 'Reviewing'; }).length;
    const actionCount = complaints.filter(function (c) { return c.status !== 'Open' && c.status !== 'Reviewing'; }).length;

    return window.HopprUI.shell('Admin Monitoring', 'Verify users, monitor ride and delivery activities, review complaints and take suitable action.',
      '<div class="grid-3">' +
        '<div class="metric-card"><span>Users</span><strong>' + window.HopprState.adminUsers.length + '</strong><small>Registered accounts</small></div>' +
        '<div class="metric-card"><span>Active Jobs</span><strong>' + activeRides + '</strong><small>Ride / delivery</small></div>' +
        '<div class="metric-card"><span>Open Complaints</span><strong>' + openCount + '</strong><small>Need admin review</small></div>' +
      '</div>' +
      '<div class="grid-3">' +
        '<div class="metric-card"><span>Reviewing</span><strong>' + reviewingCount + '</strong><small>Under investigation</small></div>' +
        '<div class="metric-card"><span>Action Taken</span><strong>' + actionCount + '</strong><small>Closed / warned / suspended</small></div>' +
        '<div class="metric-card"><span>High Priority</span><strong>' + complaints.filter(function (c) { return c.priority === 'High'; }).length + '</strong><small>Urgent reports</small></div>' +
      '</div>' +
      '<h3 class="section-title">Student Account Verification</h3>' + userList() +
      '<h3 class="section-title">Activity Monitoring</h3>' + activityList() +
      '<h3 class="section-title">Complaints and Reports</h3>' + complaintList() +
      complaintDetails()
    );
  }

  function getComplaints() {
    if (!window.HopprState.adminComplaints) {
      window.HopprState.adminComplaints = JSON.parse(JSON.stringify(window.HopprData.complaints || []));
    }
    return window.HopprState.adminComplaints;
  }

  function userList() {
    return '<div class="list-card">' + window.HopprState.adminUsers.map(function (user) {
      const verifiedClass = user.verified ? 'success' : 'warning';
      const actions = user.verified ? '<button type="button" class="danger-btn suspend-user" data-id="' + user.id + '">Suspend</button>' : '<button type="button" class="secondary-btn verify-user" data-id="' + user.id + '">Approve</button>';
      return '<div class="list-row"><div class="avatar">' + window.HopprUI.escape(user.name.charAt(0)) + '</div><div class="row-main"><strong>' + window.HopprUI.escape(user.name) + '</strong><span>' + window.HopprUI.escape(user.email) + '<br>' + window.HopprUI.escape(user.role) + '</span></div><div style="display:grid;gap:8px;justify-items:end;"><span class="badge ' + verifiedClass + '">' + (user.verified ? 'Verified' : 'Pending') + '</span>' + actions + '</div></div>';
    }).join('') + '</div>';
  }

  function activityList() {
    const activeRide = window.HopprState.activeRide ? [{ id: window.HopprState.activeRide.id, type: 'Ride', from: window.HopprState.activeRide.pickup, to: window.HopprState.activeRide.dropoff, status: window.HopprState.activeRide.status }] : [];
    const deliveries = window.HopprState.deliveryOrders.map(function (order) { return { id: order.id, type: order.type, from: order.from, to: order.to, status: order.status }; });
    const activities = activeRide.concat(deliveries).slice(0, 5);
    if (!activities.length) return '<div class="empty-card"><strong>No active records</strong>New ride and delivery activities will appear here for monitoring.</div>';
    return '<div class="list-card">' + activities.map(function (item) {
      return '<div class="list-row"><div class="row-icon">' + (item.type === 'Ride' ? '🚕' : item.type === 'Food' ? '🍱' : '📦') + '</div><div class="row-main"><strong>' + window.HopprUI.escape(item.id) + ' · ' + window.HopprUI.escape(item.type) + '</strong><span>' + window.HopprUI.escape(item.from) + ' → ' + window.HopprUI.escape(item.to) + '</span></div><span class="badge warning">' + window.HopprUI.escape(item.status) + '</span></div>';
    }).join('') + '</div>';
  }

  function statusClass(status) {
    if (status === 'Open') return 'danger';
    if (status === 'Reviewing') return 'warning';
    if (status === 'Resolved' || status === 'Closed') return 'success';
    if (status === 'Warning Issued' || status === 'Account Suspended') return 'danger';
    return 'warning';
  }

  function complaintList() {
    const complaints = getComplaints();
    if (!complaints.length) return '<div class="empty-card"><strong>No complaints</strong>New student, driver, ride and delivery reports will appear here.</div>';

    return '<div class="complaint-dashboard">' +
      '<div class="complaint-help-card">' +
        '<strong>Complaint Review Flow</strong>' +
        '<span>1. Select a report → 2. Read full details → 3. Choose admin action → 4. Update status</span>' +
      '</div>' +
      '<div class="list-card complaint-list">' + complaints.map(function (item) {
        const selected = window.HopprState.selectedComplaintId === item.id ? ' selected-complaint' : '';
        return '<div class="list-row complaint-row' + selected + '">' +
          '<div class="complaint-type-icon ' + complaintIconClass(item) + '">' + complaintIcon(item) + '</div>' +
          '<div class="row-main"><strong>' + window.HopprUI.escape(item.id) + ' · ' + window.HopprUI.escape(item.priority) + ' Priority</strong>' +
            '<span>' + window.HopprUI.escape(item.serviceType) + ' · ' + window.HopprUI.escape(item.issue) + '<br>Reported by ' + window.HopprUI.escape(item.reporter) + ' against ' + window.HopprUI.escape(item.against) + '</span></div>' +
          '<div class="admin-action-stack">' +
            '<span class="badge ' + statusClass(item.status) + '">' + window.HopprUI.escape(item.status) + '</span>' +
            '<button type="button" class="secondary-btn view-complaint" data-id="' + window.HopprUI.escape(item.id) + '">View Details</button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>' +
      (!window.HopprState.selectedComplaintId
        ? '<div class="select-complaint-hint"><strong>Select a complaint to view details</strong><span>Complaint details and admin action controls will appear only after pressing View Details.</span></div>'
        : '') +
    '</div>';
  }

  function complaintIcon(item) {
    if (item.serviceType === 'Ride Booking') return '🚕';
    if (item.serviceType === 'Food Delivery') return '🍱';
    if (item.serviceType === 'Parcel Delivery') return '📦';
    return '!';
  }

  function complaintIconClass(item) {
    if (item.priority === 'High') return 'high';
    if (item.priority === 'Medium') return 'medium';
    return 'low';
  }

  function complaintDetails() {
    const complaints = getComplaints();
    const selectedId = window.HopprState.selectedComplaintId;
    if (!selectedId) return '';
    const item = complaints.find(function (c) { return c.id === selectedId; });
    if (!item) return '';

    return '<h3 class="section-title">Complaint Details</h3>' +
      '<div id="complaintDetailsCard" class="complaint-detail-card reveal-detail">' +
        '<div class="complaint-detail-header">' +
          '<div><p class="card-label">Selected Complaint</p><h3>' + window.HopprUI.escape(item.id) + ' · ' + window.HopprUI.escape(item.issue) + '</h3></div>' +
          '<span class="badge ' + statusClass(item.status) + '">' + window.HopprUI.escape(item.status) + '</span>' +
        '</div>' +
        '<div class="complaint-flow-steps">' +
          flowStep('1', 'Review Details', 'Read reporter, evidence and route') +
          flowStep('2', 'Choose Action', 'Select warning, contact, refund or suspension') +
          flowStep('3', 'Update Status', 'Save admin note and complaint result') +
        '</div>' +
        '<div class="complaint-grid">' +
          detailLine('Reporter', item.reporter + ' (' + item.reporterRole + ')') +
          detailLine('Against', item.against + ' · ' + item.relatedUser) +
          detailLine('Service Type', item.serviceType) +
          detailLine('Related Booking', item.relatedId) +
          detailLine('Date / Time', item.date) +
          detailLine('Location / Route', item.location) +
          detailLine('Contact', item.contact) +
          detailLine('Evidence', item.evidence) +
          detailLine('Priority', item.priority) +
          detailLine('Action Taken', item.actionTaken || 'No action yet') +
        '</div>' +
        '<div class="complaint-description"><strong>Description</strong><p>' + window.HopprUI.escape(item.description) + '</p></div>' +
        '<form id="complaintActionForm" class="complaint-action-form">' +
          '<div class="grid-2">' +
            actionSelect('complaintAction', 'Admin Action', [
              'Start Review',
              'Contact Student',
              'Contact Driver',
              'Issue Warning',
              'Refund / Adjust Fee',
              'Suspend Related Account',
              'Close as Resolved',
              'Reject Complaint'
            ]) +
            actionSelect('complaintPriority', 'Update Priority', ['Low', 'Medium', 'High'], item.priority) +
          '</div>' +
          window.HopprUI.textArea('complaintNote', 'Admin Note', '', 'Write short action note, for example: contacted driver and warned for delay') +
          '<div class="button-row">' +
            '<button type="submit" class="primary-btn">Apply Action</button>' +
            '<button type="button" id="markResolved" class="secondary-btn">Mark Resolved</button>' +
          '</div>' +
        '</form>' +
      '</div>';
  }

  function flowStep(number, title, text) {
    return '<div class="flow-step"><div class="flow-number">' + window.HopprUI.escape(number) + '</div><div><strong>' + window.HopprUI.escape(title) + '</strong><span>' + window.HopprUI.escape(text) + '</span></div></div>';
  }

  function detailLine(label, value) {
    return '<div class="detail-line"><span>' + window.HopprUI.escape(label) + '</span><strong>' + window.HopprUI.escape(value || '-') + '</strong></div>';
  }

  function actionSelect(id, label, items, selected) {
    return '<div class="input-group"><label for="' + id + '">' + window.HopprUI.escape(label) + '</label><select id="' + id + '">' +
      items.map(function (item) {
        return '<option value="' + window.HopprUI.escape(item) + '"' + (selected === item ? ' selected' : '') + '>' + window.HopprUI.escape(item) + '</option>';
      }).join('') + '</select></div>';
  }

  function applyComplaintAction(item, action, priority, note) {
    item.priority = priority || item.priority;
    item.lastUpdated = 'Today, just now';

    if (action === 'Start Review') {
      item.status = 'Reviewing';
      item.actionTaken = 'Admin started complaint review' + (note ? ': ' + note : '.');
    } else if (action === 'Contact Student') {
      item.status = 'Reviewing';
      item.actionTaken = 'Student contacted for more details' + (note ? ': ' + note : '.');
    } else if (action === 'Contact Driver') {
      item.status = 'Reviewing';
      item.actionTaken = 'Driver contacted for explanation' + (note ? ': ' + note : '.');
    } else if (action === 'Issue Warning') {
      item.status = 'Warning Issued';
      item.actionTaken = 'Warning issued to related user' + (note ? ': ' + note : '.');
    } else if (action === 'Refund / Adjust Fee') {
      item.status = 'Resolved';
      item.actionTaken = 'Refund or fee adjustment approved' + (note ? ': ' + note : '.');
    } else if (action === 'Suspend Related Account') {
      item.status = 'Account Suspended';
      item.actionTaken = 'Related account suspended for admin review' + (note ? ': ' + note : '.');
    } else if (action === 'Close as Resolved') {
      item.status = 'Resolved';
      item.actionTaken = 'Complaint closed as resolved' + (note ? ': ' + note : '.');
    } else if (action === 'Reject Complaint') {
      item.status = 'Closed';
      item.actionTaken = 'Complaint rejected after review' + (note ? ': ' + note : '.');
    }
  }

  function bindAdmin() {
    window.HopprUI.qsa('.verify-user').forEach(function (button) {
      button.addEventListener('click', function () {
        const id = Number(button.getAttribute('data-id'));
        const user = window.HopprState.adminUsers.find(function (u) { return u.id === id; });
        if (user) {
          user.verified = true;
          user.status = 'Active';
          window.HopprUI.toast('User account approved.', 'success');
          window.HopprRouter.go('admin');
        }
      });
    });

    window.HopprUI.qsa('.suspend-user').forEach(function (button) {
      button.addEventListener('click', function () {
        const id = Number(button.getAttribute('data-id'));
        const user = window.HopprState.adminUsers.find(function (u) { return u.id === id; });
        if (user) {
          user.status = 'Suspended';
          user.verified = false;
          window.HopprUI.toast('Account suspended for review.', 'warning');
          window.HopprRouter.go('admin');
        }
      });
    });

    window.HopprUI.qsa('.view-complaint').forEach(function (button) {
      button.addEventListener('click', function () {
        window.HopprState.selectedComplaintId = button.getAttribute('data-id');
        window.HopprState.scrollToComplaintDetails = true;
        window.HopprUI.toast('Complaint details opened.', 'success');
        window.HopprRouter.go('admin');
      });
    });

    const form = window.HopprUI.el('complaintActionForm');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        const complaints = getComplaints();
        const id = window.HopprState.selectedComplaintId || (complaints[0] && complaints[0].id);
        const item = complaints.find(function (c) { return c.id === id; });
        if (!item) return;

        const action = window.HopprUI.el('complaintAction').value;
        const priority = window.HopprUI.el('complaintPriority').value;
        const note = window.HopprUI.el('complaintNote').value.trim();

        applyComplaintAction(item, action, priority, note);
        window.HopprState.notifications.unshift('Admin action updated for complaint ' + item.id + ': ' + action);
        window.HopprUI.toast('Complaint action applied: ' + action, 'success');
        window.HopprRouter.go('admin');
      });
    }

    if (window.HopprState.scrollToComplaintDetails) {
      window.HopprState.scrollToComplaintDetails = false;
      setTimeout(function () {
        const target = window.HopprUI.el('complaintDetailsCard');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }

    const resolved = window.HopprUI.el('markResolved');
    if (resolved) {
      resolved.addEventListener('click', function () {
        const complaints = getComplaints();
        const id = window.HopprState.selectedComplaintId || (complaints[0] && complaints[0].id);
        const item = complaints.find(function (c) { return c.id === id; });
        if (item) {
          item.status = 'Resolved';
          item.actionTaken = 'Complaint marked as resolved by admin.';
          item.lastUpdated = 'Today, just now';
          window.HopprUI.toast('Complaint marked as resolved.', 'success');
          window.HopprRouter.go('admin');
        }
      });
    }
  }

  window.HopprRouter.register('admin', adminScreen);
  window.HopprBinders.admin = bindAdmin;
})();

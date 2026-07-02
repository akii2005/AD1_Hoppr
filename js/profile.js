(function () {
  function profileScreen() {
    if (!window.HopprUI.requireUser()) return '';
    const user = window.HopprState.activeUser;
    return window.HopprUI.shell('Profile Management', 'View and update profile information, photo placeholder, dark mode and notification preferences.',
      '<div class="profile-card">' +
        '<div class="profile-photo">' + window.HopprUI.escape(user.name.charAt(0)) + '</div>' +
        '<h3>' + window.HopprUI.escape(user.name) + '</h3>' +
        '<p>' + window.HopprUI.escape(user.role) + '</p>' +
        '<div class="grid-2" style="margin-top:16px;text-align:left;">' +
          '<div class="metric-card"><span>Email</span><strong style="font-size:13px;letter-spacing:0;">' + window.HopprUI.escape(user.email) + '</strong></div>' +
          '<div class="metric-card"><span>Status</span><strong style="font-size:16px;">' + (user.verified ? 'Verified' : 'Pending') + '</strong></div>' +
        '</div>' +
      '</div>' +
      '<form id="profileForm" class="form-card">' +
        window.HopprUI.input('profileName', 'Full Name', 'text', user.name, 'Full name') +
        window.HopprUI.input('profilePhone', 'Phone Number', 'tel', user.phone, 'Phone number') +
        window.HopprUI.input('profileFaculty', 'Faculty', 'text', user.faculty, 'Faculty') +
        window.HopprUI.input('profileDegree', 'Degree / Role Details', 'text', user.degree || user.role, 'Degree') +
        '<button class="primary-btn" type="submit">Save Changes</button>' +
      '</form>' +
      '<div class="form-card">' +
        '<div class="toggle-row"><div><strong>Dark Mode</strong><p class="help-text">Save app theme preference.</p></div><button type="button" id="darkToggle" class="switch ' + (window.HopprState.darkMode ? 'on' : '') + '" aria-label="Toggle dark mode"></button></div>' +
        '<div class="toggle-row"><div><strong>Push Notifications</strong><p class="help-text">Enable booking, arrival and completion alerts.</p></div><button type="button" id="notificationToggle" class="switch ' + (window.HopprState.notificationsEnabled ? 'on' : '') + '" aria-label="Toggle notifications"></button></div>' +
        '<button class="danger-btn" type="button" id="logoutButton">Log Out</button>' +
      '</div>'
    );
  }

  function bindProfile() {
    const form = window.HopprUI.el('profileForm');
    if (form) form.addEventListener('submit', function (event) {
      event.preventDefault();
      const user = window.HopprState.activeUser;
      user.name = window.HopprUI.el('profileName').value.trim() || user.name;
      user.phone = window.HopprUI.el('profilePhone').value.trim() || user.phone;
      user.faculty = window.HopprUI.el('profileFaculty').value.trim() || user.faculty;
      user.degree = window.HopprUI.el('profileDegree').value.trim() || user.degree;
      window.HopprUI.toast('Profile updated successfully.', 'success');
      window.HopprRouter.go('profile');
    });

    const darkToggle = window.HopprUI.el('darkToggle');
    if (darkToggle) darkToggle.addEventListener('click', function () {
      window.HopprState.darkMode = !window.HopprState.darkMode;
      document.body.classList.toggle('dark', window.HopprState.darkMode);
      window.HopprUI.toast('Theme preference updated.', 'success');
      window.HopprRouter.go('profile');
    });

    const notificationToggle = window.HopprUI.el('notificationToggle');
    if (notificationToggle) notificationToggle.addEventListener('click', function () {
      window.HopprState.notificationsEnabled = !window.HopprState.notificationsEnabled;
      window.HopprUI.toast('Notification preference updated.', 'success');
      window.HopprRouter.go('profile');
    });

    const logout = window.HopprUI.el('logoutButton');
    if (logout) logout.addEventListener('click', function () {
      window.HopprState.activeUser = null;
      window.HopprUI.toast('Logged out successfully.', 'success');
      window.HopprRouter.go('home');
    });
  }

  window.HopprRouter.register('profile', profileScreen);
  window.HopprBinders.profile = bindProfile;
})();

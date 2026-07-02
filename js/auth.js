(function () {
  function authScreen(params) {
    const mode = params.mode || 'login';
    const selectedEmail = params.demoEmail || '';
    const intro = '<div class="welcome-card">' +
      '<img src="assets/logo.svg" alt="Hoppr logo" class="welcome-logo">' +
      '<h2>Access your verified UTM account</h2>' +
      '<p>Login or create an account to use Hoppr ride booking, delivery, driver and admin services.</p>' +
      '<div class="button-row"><button class="secondary-btn" type="button" data-route="home">Back Home</button></div>' +
    '</div>';
    const segments = '<div class="segmented"><button type="button" id="loginTab" class="' + (mode === 'login' ? 'active' : '') + '">Log In</button><button type="button" id="registerTab" class="' + (mode === 'register' ? 'active' : '') + '">Sign Up</button></div>';
    if (mode === 'reset') return '<div class="stack">' + intro + resetForm() + '</div>';
    if (mode === 'verify') return '<div class="stack">' + intro + verifyForm() + '</div>';
    return '<div class="stack">' + intro + segments + (mode === 'register' ? registerForm() : loginForm(selectedEmail)) + '</div>';
  }

  function loginForm(selectedEmail) {
    return '<form id="loginForm" class="form-card">' +
      window.HopprUI.input('loginEmail', 'UTM Email', 'email', selectedEmail || '', 'student@student.utm.my') +
      window.HopprUI.input('loginPassword', 'Password', 'password', selectedEmail ? 'Password123' : '', 'Password123') +
      '<p class="help-text">Click a demo account below to auto-fill both fields.</p>' + demoCards() +
      '<button class="primary-btn" type="submit">Log In</button>' +
      '<button class="ghost-btn" type="button" id="forgotPassword">Forgot Password?</button>' +
      '<button class="ghost-btn" type="button" data-route="home">Back to Welcome</button>' +
      '</form>';
  }

  function demoCards() {
    return '<div class="demo-grid">' +
      demoCard('Student Passenger', 'student@student.utm.my') +
      demoCard('Student Driver', 'driver@student.utm.my') +
      demoCard('Admin Supervisor', 'admin@utm.my') +
    '</div>';
  }
  function demoCard(label, email) {
    return '<button type="button" class="demo-login-card" data-demo-email="' + window.HopprUI.escape(email) + '"><strong>' + window.HopprUI.escape(label) + '</strong><span>' + window.HopprUI.escape(email) + '</span></button>';
  }

  function registerForm() {
    return '<form id="registerForm" class="form-card">' +
      window.HopprUI.input('registerName', 'Full Name', 'text', 'Ahmed Kamal Ibrahim', 'Full name') +
      window.HopprUI.input('registerEmail', 'UTM Email', 'email', 'ahmed@student.utm.my', 'name@student.utm.my') +
      window.HopprUI.input('registerPhone', 'Phone Number', 'tel', '+60 11 1234 5678', 'Phone number') +
      window.HopprUI.select('registerRole', 'Account Type', ['Student Passenger', 'Student Driver', 'Admin'], 'Student Passenger') +
      window.HopprUI.input('registerPassword', 'Password', 'password', 'Password123', 'Minimum 8 characters') +
      '<p class="help-text">Allowed domains: @student.utm.my, @graduate.utm.my and @utm.my.</p>' +
      '<button class="primary-btn" type="submit">Create Account</button>' +
      '<button class="ghost-btn" type="button" data-route="home">Back to Welcome</button>' +
      '</form>';
  }

  function resetForm() {
    return '<form id="resetForm" class="form-card">' +
      '<h3 class="section-title">Reset Password</h3>' +
      window.HopprUI.input('resetEmail', 'Registered UTM Email', 'email', 'student@student.utm.my', 'your email') +
      window.HopprUI.input('resetCode', 'Verification Code', 'text', '123456', '6-digit code') +
      window.HopprUI.input('resetNewPassword', 'New Password', 'password', 'Password123', 'Minimum 8 characters') +
      '<button class="primary-btn" type="submit">Reset Password</button>' +
      '<button class="ghost-btn" type="button" id="backToLogin">Back to Login</button>' +
      '<button class="ghost-btn" type="button" data-route="home">Back to Welcome</button>' +
      '</form>';
  }

  function verifyForm() {
    return '<form id="verifyForm" class="form-card">' +
      '<h3 class="section-title">Verify Your Email</h3>' +
      '<p class="help-text">Enter the 6-digit verification code sent to your UTM email. Use <strong>123456</strong> for the prototype.</p>' +
      window.HopprUI.input('verifyCode', 'Verification Code', 'text', '123456', '6-digit code') +
      '<button class="primary-btn" type="submit">Verify Email</button>' +
      '<button class="ghost-btn" type="button" id="resendCode">Resend Code</button>' +
      '<button class="ghost-btn" type="button" data-route="home">Back to Welcome</button>' +
      '</form>';
  }

  function bindAuth(params) {
    const loginTab = window.HopprUI.el('loginTab');
    const registerTab = window.HopprUI.el('registerTab');
    if (loginTab) loginTab.addEventListener('click', function () { window.HopprRouter.go('auth', { mode: 'login' }); });
    if (registerTab) registerTab.addEventListener('click', function () { window.HopprRouter.go('auth', { mode: 'register' }); });

    const forgot = window.HopprUI.el('forgotPassword');
    if (forgot) forgot.addEventListener('click', function () { window.HopprRouter.go('auth', { mode: 'reset' }); });

    const back = window.HopprUI.el('backToLogin');
    if (back) back.addEventListener('click', function () { window.HopprRouter.go('auth', { mode: 'login' }); });

    const resend = window.HopprUI.el('resendCode');
    if (resend) resend.addEventListener('click', function () { window.HopprUI.toast('Verification code resent to UTM email.', 'success'); });

    window.HopprUI.qsa('[data-demo-email]').forEach(function (button) {
      button.addEventListener('click', function () { fillDemo(button.getAttribute('data-demo-email')); });
    });

    const loginForm = window.HopprUI.el('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    const registerForm = window.HopprUI.el('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    const resetForm = window.HopprUI.el('resetForm');
    if (resetForm) resetForm.addEventListener('submit', handleReset);
    const verifyForm = window.HopprUI.el('verifyForm');
    if (verifyForm) verifyForm.addEventListener('submit', handleVerify);

    if (params.demoEmail) fillDemo(params.demoEmail, true);
  }

  function fillDemo(email, silent) {
    const loginEmail = window.HopprUI.el('loginEmail');
    const loginPassword = window.HopprUI.el('loginPassword');
    if (!loginEmail || !loginPassword) {
      window.HopprRouter.go('auth', { mode: 'login', demoEmail: email });
      return;
    }
    loginEmail.value = email;
    loginPassword.value = 'Password123';
    if (!silent) window.HopprUI.toast('Demo account filled. Press Log In to continue.', 'success');
  }

  function handleLogin(event) {
    event.preventDefault();
    const email = window.HopprUI.el('loginEmail').value.trim();
    const password = window.HopprUI.el('loginPassword').value;
    const user = window.HopprData.users.find(function (u) { return u.email.toLowerCase() === email.toLowerCase() && u.password === password; });
    if (!window.HopprUI.validUtmEmail(email)) {
      window.HopprUI.toast('Please use a valid UTM email address.', 'danger');
      return;
    }
    if (!user) {
      window.HopprUI.toast('Invalid email or password. Please try again.', 'danger');
      return;
    }
    if (!user.verified) {
      window.HopprUI.toast('Please verify your email before logging in.', 'warning');
      window.HopprRouter.go('auth', { mode: 'verify' });
      return;
    }
    window.HopprState.activeUser = JSON.parse(JSON.stringify(user));
    window.HopprUI.hideAuthModal();
    window.HopprUI.toast('Login successful. Welcome ' + user.name + '.', 'success');
    window.HopprRouter.go('home');
  }

  function handleRegister(event) {
    event.preventDefault();
    const name = window.HopprUI.el('registerName').value.trim();
    const email = window.HopprUI.el('registerEmail').value.trim();
    const phone = window.HopprUI.el('registerPhone').value.trim();
    const role = window.HopprUI.el('registerRole').value;
    const password = window.HopprUI.el('registerPassword').value;
    if (!name || !email || !phone) {
      window.HopprUI.toast('Please complete all required fields.', 'danger');
      return;
    }
    if (!window.HopprUI.validUtmEmail(email)) {
      window.HopprUI.toast('Please use a valid UTM email address.', 'danger');
      return;
    }
    if (password.length < 8) {
      window.HopprUI.toast('Password must be at least 8 characters long.', 'danger');
      return;
    }
    if (window.HopprData.users.some(function (u) { return u.email.toLowerCase() === email.toLowerCase(); })) {
      window.HopprUI.toast('An account with this email already exists. Please log in.', 'danger');
      return;
    }
    const newUser = { id: Date.now(), name: name, email: email, password: password, role: role, phone: phone, faculty: 'Faculty of Computing', degree: 'Bachelor of Computer Science', verified: false, status: 'Pending Verification' };
    window.HopprData.users.push(newUser);
    window.HopprState.adminUsers.push(JSON.parse(JSON.stringify(newUser)));
    window.HopprState.activeUser = newUser;
    window.HopprUI.toast('Account created. Please verify your email to continue.', 'success');
    window.HopprRouter.go('auth', { mode: 'verify' });
  }

  function handleReset(event) {
    event.preventDefault();
    const email = window.HopprUI.el('resetEmail').value.trim();
    const code = window.HopprUI.el('resetCode').value.trim();
    const password = window.HopprUI.el('resetNewPassword').value;
    const user = window.HopprData.users.find(function (u) { return u.email.toLowerCase() === email.toLowerCase(); });
    if (!user) {
      window.HopprUI.toast('No account found with this email address.', 'danger');
      return;
    }
    if (code !== '123456') {
      window.HopprUI.toast('Invalid or expired code. Please request a new one.', 'danger');
      return;
    }
    if (password.length < 8) {
      window.HopprUI.toast('Password must be at least 8 characters long.', 'danger');
      return;
    }
    user.password = password;
    window.HopprUI.toast('Your password has been reset. Please log in.', 'success');
    window.HopprRouter.go('auth', { mode: 'login', demoEmail: email });
  }

  function handleVerify(event) {
    event.preventDefault();
    const code = window.HopprUI.el('verifyCode').value.trim();
    if (code !== '123456') {
      window.HopprUI.toast('Invalid verification code.', 'danger');
      return;
    }
    if (window.HopprState.activeUser) {
      window.HopprState.activeUser.verified = true;
      window.HopprState.activeUser.status = 'Active';
    }
    window.HopprUI.toast('Email verified successfully.', 'success');
    window.HopprRouter.go('home');
  }

  window.HopprRouter.register('auth', authScreen);
  window.HopprBinders.auth = bindAuth;
})();

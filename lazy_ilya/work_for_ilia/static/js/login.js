class Auth {
  constructor() {
    this.form = document.getElementById('loginForm');
    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleLogin(e));
    
    // Check if already logged in
    if (this.isLoggedIn()) {
      window.location.href = 'index.html';
    }
  }

  handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === '123') {
      localStorage.setItem('isLoggedIn', 'true');
      window.location.href = 'index.html';
    } else {
      alert('Неверный логин или пароль');
    }
  }

  isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
}

const auth = new Auth();
// User management and authentication module
const AuthModule = {
  currentUser: null,
  apiBaseUrl: 'https://api.shary.az/v1', // Simulated API base URL
  
  // Simulated database
  users: JSON.parse(localStorage.getItem('shary_users_db')) || [],
  
  // Initialize the module
  init: function() {
    this.loadCurrentUser();
    this.setupEventListeners();
    this.checkLoginStatus();
  },
  
  // Load current user from localStorage
  loadCurrentUser: function() {
    const userData = localStorage.getItem('shary_currentUser');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  },
  
  // Save current user to localStorage
  saveCurrentUser: function() {
    if (this.currentUser) {
      localStorage.setItem('shary_currentUser', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('shary_currentUser');
    }
  },
  
  // Save users database
  saveUsersDB: function() {
    localStorage.setItem('shary_users_db', JSON.stringify(this.users));
  },
  
  // Simulated password hashing
  hashPassword: function(password) {
    // In a real app, use proper hashing like bcrypt
    return 'hashed_' + password.split('').reverse().join('') + '_' + password.length;
  },
  
  // Validate email format
  validateEmail: function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  // Validate password strength
  validatePassword: function(password) {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  },
  
  // Simulated API call
  apiRequest: async function(endpoint, method = 'GET', data = null) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Simulate different endpoints
      switch(endpoint) {
        case '/auth/login':
          if (method === 'POST') {
            const user = this.users.find(u => 
              u.email === data.email && 
              u.password === this.hashPassword(data.password)
            );
            
            if (!user) {
              throw new Error('Invalid email or password');
            }
            
            return { 
              success: true, 
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                joinDate: user.joinDate
              }
            };
          }
          break;
          
        case '/auth/register':
          if (method === 'POST') {
            // Check if email exists
            if (this.users.some(u => u.email === data.email)) {
              throw new Error('Email already registered');
            }
            
            // Create new user
            const newUser = {
              id: 'user_' + Math.random().toString(36).substr(2, 9),
              ...data,
              password: this.hashPassword(data.password),
              joinDate: new Date().toISOString()
            };
            
            this.users.push(newUser);
            this.saveUsersDB();
            
            return { 
              success: true, 
              user: {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                joinDate: newUser.joinDate
              }
            };
          }
          break;
          
        case '/auth/logout':
          return { success: true };
          
        default:
          throw new Error('Endpoint not found');
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'An error occurred'
      };
    }
  },
  
  // Handle login
  handleLogin: async function(email, password, rememberMe) {
    if (!email || !password) {
      throw new Error('Please fill in all fields');
    }
    
    if (!this.validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    const response = await this.apiRequest('/auth/login', 'POST', { email, password });
    
    if (response.success) {
      this.currentUser = response.user;
      this.saveCurrentUser();
      
      if (rememberMe) {
        localStorage.setItem('shary_rememberMe', 'true');
      }
      
      return true;
    } else {
      throw new Error(response.error);
    }
  },
  
  // Handle registration
  handleRegister: async function(formData) {
    const { firstName, lastName, email, password, confirmPassword, terms } = formData;
    
    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      throw new Error('Please fill in all fields');
    }
    
    if (!terms) {
      throw new Error('You must accept the terms and conditions');
    }
    
    if (!this.validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    if (!this.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters with at least one uppercase letter and one number');
    }
    
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    const response = await this.apiRequest('/auth/register', 'POST', {
      firstName,
      lastName,
      email,
      password
    });
    
    if (response.success) {
      this.currentUser = response.user;
      this.saveCurrentUser();
      return true;
    } else {
      throw new Error(response.error);
    }
  },
  
  // Handle logout
  handleLogout: async function() {
    await this.apiRequest('/auth/logout');
    this.currentUser = null;
    this.saveCurrentUser();
    localStorage.removeItem('shary_rememberMe');
    return true;
  },
  
  // Check login status and update UI
  checkLoginStatus: function() {
    if (this.currentUser) {
      this.updateUIForLoggedInUser();
    }
  },
  
  // Update UI when user is logged in
  updateUIForLoggedInUser: function() {
    if (!this.currentUser) return;
    
    // Update header
    const headerAuthButtons = document.querySelector('.auth-buttons');
    if (headerAuthButtons) {
      headerAuthButtons.innerHTML = `
        <div class="user-dropdown">
          <button class="user-profile-btn">
            <i class="fas fa-user-circle"></i> ${this.currentUser.firstName}
            <i class="fas fa-chevron-down"></i>
          </button>
          <div class="dropdown-menu">
            <a href="#"><i class="fas fa-user"></i> My Profile</a>
            <a href="#"><i class="fas fa-box-open"></i> My Rentals</a>
            <a href="#"><i class="fas fa-cog"></i> Settings</a>
            <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </div>
        </div>
      `;
      
      // Add logout functionality
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await this.handleLogout();
            window.location.href = 'index.html';
          } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed: ' + error.message);
          }
        });
      }
    }
    
    // Add user dashboard section to index.html
    const mainContent = document.querySelector('main') || document.querySelector('.hero');
    if (mainContent && document.querySelector('.user-dashboard') === null) {
      const dashboardHTML = `
        <section class="user-dashboard">
          <div class="container">
            <h2>Welcome back, ${this.currentUser.firstName}!</h2>
            <div class="dashboard-cards">
              <div class="dashboard-card">
                <h3>My Rentals</h3>
                <p>You have 3 active rentals</p>
                <a href="#" class="dashboard-link">View all rentals</a>
              </div>
              <div class="dashboard-card">
                <h3>Account Details</h3>
                <p>${this.currentUser.email}</p>
                <p>Member since ${new Date(this.currentUser.joinDate).toLocaleDateString()}</p>
              </div>
              <div class="dashboard-card">
                <h3>Quick Actions</h3>
                <a href="#" class="dashboard-btn">List an Item</a>
                <a href="#" class="dashboard-btn">Browse Items</a>
              </div>
            </div>
          </div>
        </section>
      `;
      mainContent.insertAdjacentHTML('afterend', dashboardHTML);
    }
  },
  
  // Setup event listeners for forms
  setupEventListeners: function() {
    // Sign in form
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
      signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember').checked;
        
        try {
          await this.handleLogin(email, password, rememberMe);
          alert('Sign in successful! Redirecting to homepage...');
          window.location.href = 'index.html';
        } catch (error) {
          alert('Sign in failed: ' + error.message);
        }
      });
    }
    
    // Sign up form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
          firstName: document.getElementById('first-name').value,
          lastName: document.getElementById('last-name').value,
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
          confirmPassword: document.getElementById('confirm-password').value,
          terms: document.getElementById('terms').checked
        };
        
        try {
          await this.handleRegister(formData);
          alert('Account created successfully! Redirecting to homepage...');
          window.location.href = 'index.html';
        } catch (error) {
          alert('Registration failed: ' + error.message);
        }
      });
    }
    
    // Password toggle functionality
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
      button.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const icon = this.querySelector('i');
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      });
    });
    
    // Password strength indicator
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.addEventListener('input', function() {
        const strengthBars = document.querySelectorAll('.strength-bar');
        const strengthText = document.querySelector('.strength-text');
        const password = this.value;
        
        // Reset all bars
        strengthBars.forEach(bar => bar.style.backgroundColor = '#e2e8f0');
        
        // Calculate strength
        let strength = 0;
        if (password.length > 0) strength += 1;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        // Update UI
        const colors = ['#f56565', '#f6ad55', '#f6e05e', '#68d391', '#48bb78'];
        const messages = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
        
        for (let i = 0; i < strength; i++) {
          strengthBars[i].style.backgroundColor = colors[strength - 1];
        }
        
        if (strengthText) {
          strengthText.textContent = password.length > 0 ? messages[strength - 1] : '';
          strengthText.style.color = colors[strength - 1];
        }
      });
    }
    
    // Social login buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
      button.addEventListener('click', function() {
        const provider = this.classList.contains('google') ? 'Google' : 'Facebook';
        alert(`Redirecting to ${provider} login...`);
      });
    });
  }
};

// Initialize the authentication module when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  AuthModule.init();
});
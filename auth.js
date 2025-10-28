// Import Supabase client
import { supabase, signUp, signIn, signOut, getCurrentUser } from './supabase-client.js';

// Global state
window.isAuthenticated = false;
window.currentUser = null;
window.useOfflineMode = localStorage.getItem('offlineMode') === 'true';

// ===== Authentication Functions =====

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    try {
        errorEl.classList.add('hidden');
        const { user } = await signIn(email, password);
        window.currentUser = user;
        window.isAuthenticated = true;
        localStorage.setItem('offlineMode', 'false');
        hideAuthScreen();
        showToast('Welcome back!');
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    }
}

async function handleSignUp(event) {
    event.preventDefault();

    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupPasswordConfirm').value;
    const errorEl = document.getElementById('signupError');

    // Validate passwords match
    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.classList.remove('hidden');
        return;
    }

    try {
        errorEl.classList.add('hidden');
        await signUp(email, password);
        errorEl.textContent = 'Account created! Check your email to confirm.';
        errorEl.style.background = 'rgba(76, 175, 80, 0.1)';
        errorEl.style.borderColor = 'rgba(76, 175, 80, 0.3)';
        errorEl.style.color = '#4CAF50';
        errorEl.classList.remove('hidden');

        // Switch to login after 3 seconds
        setTimeout(() => {
            showLogin();
        }, 3000);
    } catch (error) {
        errorEl.style.background = 'rgba(239, 68, 68, 0.1)';
        errorEl.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        errorEl.style.color = '#ef4444';
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    }
}

function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
}

function showSignUp() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}

function continueOffline() {
    window.useOfflineMode = true;
    window.isAuthenticated = false;
    localStorage.setItem('offlineMode', 'true');
    hideAuthScreen();
    showToast('Continuing in offline mode');
}

function hideAuthScreen() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
}

async function showLogoutButton() {
    // Add logout button to dashboard if authenticated
    if (window.isAuthenticated) {
        const header = document.querySelector('#dashboardView .view-header');
        if (header && !document.getElementById('logoutBtn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.className = 'btn-secondary';
            logoutBtn.textContent = 'Sign Out';
            logoutBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; padding: 8px 16px; font-size: 14px;';
            logoutBtn.onclick = async () => {
                await signOut();
                window.isAuthenticated = false;
                window.currentUser = null;
                localStorage.setItem('offlineMode', 'true');
                location.reload();
            };
            header.style.position = 'relative';
            header.appendChild(logoutBtn);
        }
    }
}

// ===== Initialize Authentication =====

async function initAuth() {
    // Check if user wants offline mode
    if (window.useOfflineMode) {
        hideAuthScreen();
        return;
    }

    // Check for existing session
    try {
        const user = await getCurrentUser();
        if (user) {
            window.currentUser = user;
            window.isAuthenticated = true;
            hideAuthScreen();
            setTimeout(showLogoutButton, 1000);
        } else {
            // Show auth screen after loading
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
                document.getElementById('authScreen').classList.remove('hidden');
            }, 1500);
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        // Show auth screen after loading
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('authScreen').classList.remove('hidden');
        }, 1500);
    }
}

// Make functions globally available
window.handleLogin = handleLogin;
window.handleSignUp = handleSignUp;
window.showLogin = showLogin;
window.showSignUp = showSignUp;
window.continueOffline = continueOffline;

// Initialize on page load
window.addEventListener('DOMContentLoaded', initAuth);

// --- GESTION DES ONGLETS ---
const tabBtns = document.querySelectorAll('.tab-btn');
const forms = document.querySelectorAll('.auth-form');
const reginput = document.getElementById('registerSubmit');
const lgInput = document.getElementById('register-username');
const mdpInput = document.getElementById('register-password');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        forms.forEach(form => {
            form.classList.remove('active');
            if (form.id === tab + 'Form') {
                form.classList.add('active');
            }
        });
    });
});

// --- FONCTIONS DE LA POPUP ---
function hideAuthPopup() {
    const overlay = document.getElementById('authOverlay');
    overlay.style.animation = 'fadeOut 0.3s ease';
    
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
    
    document.getElementById('logoutBtn').style.display = 'block';
}

function showAuthPopup() {
    const overlay = document.getElementById('authOverlay');
    overlay.style.display = 'flex';
    overlay.style.animation = 'fadeIn 0.3s ease';
    document.getElementById('logoutBtn').style.display = 'none';
}

// --- SOUMISSION DES FORMULAIRES ---

// Connexion
const loginButton = document.getElementById('loginButton');
loginButton.addEventListener('click', () => {
    const loginInput = document.getElementById('login-username').value;
    const passwordInput = document.getElementById('login-password').value;

    fetch('/connexion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ login: loginInput, password: passwordInput })
    }).then(response => response.json())
        .then(data => {
            alert(data.message);
            alert('ID utilisateur : ' + data.user.id);
            localStorage.setItem('userId', data.user.id);
        });
    hideAuthPopup();
});

// Inscription
reginput.addEventListener('click', () => {
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ loginValue: lgInput.value, passwordValue: mdpInput.value })
    }).then(response => response.text())
        .then(data => {
            alert(data);
        });
    hideAuthPopup();
});



// --- DÉCONNEXION ---
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('userId');
    showAuthPopup();
});

// --- ÉTAT INITIAL (Chargement) ---
window.addEventListener('load', function() {
    const user = localStorage.getItem('user');
    if (user) {
        hideAuthPopup();
    } else {
        showAuthPopup();
    }
});

// --- ANIMATIONS AU SCROLL ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .stat-item, .step, .leaderboard-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
});
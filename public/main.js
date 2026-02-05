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
if (loginButton) {
    loginButton.addEventListener('click', () => {
        const loginInputElem = document.getElementById('login-username');
        const passwordInputElem = document.getElementById('login-password');
        const loginInput = loginInputElem ? loginInputElem.value : '';
        const passwordInput = passwordInputElem ? passwordInputElem.value : '';

        fetch('/connexion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ login: loginInput, password: passwordInput })
        }).then(response => response.json())
            .then(data => {
                alert(data.message);
                if (data && data.user && data.user.id) {
                    alert('ID utilisateur : ' + data.user.id);
                    localStorage.setItem('userId', data.user.id);
                }
            })
            .catch(err => console.error(err));
        hideAuthPopup();
    });
}

// Inscription
if (reginput) {
    reginput.addEventListener('click', () => {
        const loginVal = lgInput ? lgInput.value : '';
        const passVal = mdpInput ? mdpInput.value : '';
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ loginValue: loginVal, passwordValue: passVal })
        }).then(response => response.text())
            .then(data => {
                alert(data);
            })
            .catch(err => console.error(err));
        hideAuthPopup();
    });
}

//---RECUPERATION DE TOUT LES USERS POUR LA CREATION DE MATCH POUR AFFICHER LEUR LOGIN DANS LA LISTE DEROULANTE---
window.onload = () => {
    fetch('/users')

        .then(response => response.json())
        .then(users => {
            const usersList = document.getElementById('userlist');
            users.forEach(user => {
                //création d'un input select option avec id en value et login en texte  
                const option = document.createElement('option');
                option.value = users.id;
                option.text = users.login;
                usersList.appendChild(option);

            });
        });
};
//---CREATION DE POPUP QUAND ON APPUIE SUR CREER UN MATCH---
function showCreateMatchPopup() {
    const popup = document.getElementById('createMatchPopup');
    if (popup) {
        popup.style.display = 'block';
    }
}

function hideCreateMatchPopup() {
    const popup = document.getElementById('createMatchPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

//---CREATION DE MATCH AVEC LE BOUTON DE LA POPUP---
const createMatchBtn = document.getElementById('createMatchBtn');
if (createMatchBtn) {
    createMatchBtn.addEventListener('click', () => {
        const userSelect = document.getElementById('userSelect');
        const selectedUserId = userSelect ? userSelect.value : null;
        if (selectedUserId) {
            fetch('/create-match', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ opponentId: selectedUserId })
            }).then(response => response.json())
                .then(data => {
                    alert(data.message);
                    hideCreateMatchPopup();
                })
                .catch(err => console.error(err));
        } else {
            alert('Veuillez sélectionner un adversaire.');
        }
    });
}
// --- DÉCONNEXION ---
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userId');
        showAuthPopup();
    });
}

// --- ÉTAT INITIAL (Chargement) ---
window.addEventListener('load', function() {
    const userId = localStorage.getItem('userId');
    if (userId) {
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
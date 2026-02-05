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

//---RECUPERATION DE TOUT LES USERS---
window.onload = () => {
    fetch('/users')
        .then(response => response.json())
        .then(users => {
            const usersList = document.getElementById('userlist');
            if (!usersList) return; // Sécurité si l'élément n'existe pas
            
            usersList.innerHTML = '<option value="">--Sélectionnez un adversaire--</option>'; // Nettoie la liste

            users.forEach(user => {
                const option = document.createElement('option');
                // On utilise bien 'user' au singulier ici
                option.value = user.id; 
                option.text = user.login || user.username; // Utilise login ou username selon ton backend
                usersList.appendChild(option);
            });
        })
        .catch(err => console.error("Erreur lors de la récup des users:", err));
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

//---CREATION DE MATCH AVEC LA POPUP QUI S'OUVRE---
const createMatchForm = document.getElementById('createMatchForm');
if (createMatchForm) {
    createMatchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const player1_id = localStorage.getItem('userId');
        const player2_id = document.getElementById('userlist').value;
        const categorie = document.getElementById('gameSelect').value;
        fetch('/createMatch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ player1_id, player2_id, categorie })
        }).then(response => response.json())
            .then(data => {
                alert(data.message);
                hideCreateMatchPopup();
            })
            .catch(err => console.error(err));
    });
}

// Affiche ou cache la zone de saisie sous le match
function toggleResultZone(id_match) {
    const zone = document.getElementById(`input-zone-${id_match}`);
    zone.style.display = zone.style.display === 'none' ? 'block' : 'none';
}

// Envoie les données au serveur
function submitMatch(id_match, id_j1, id_j2) {
    const score_j1 = document.getElementById(`sc1-${id_match}`).value;
    const score_j2 = document.getElementById(`sc2-${id_match}`).value;

    if (score_j1 === "" || score_j2 === "") {
        alert("Veuillez remplir les deux scores !");
        return;
    }

    // Calcul du gagnant
    let gagnant = null;
    if (parseInt(score_j1) > parseInt(score_j2)) gagnant = id_j1;
    else if (parseInt(score_j2) > parseInt(score_j1)) gagnant = id_j2;

    fetch('/finishMatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id_match, 
            id_j1, 
            id_j2, 
            score_j1, 
            score_j2, 
            gagnant 
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        location.reload(); // Rafraîchit pour mettre à jour l'affichage
    })
    .catch(err => console.error(err));
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
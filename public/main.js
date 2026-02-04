/**
 * GESTION DES AFFICHAGES (POPUP & UI)
 */

window.showAuthPopup = function() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) {
        overlay.style.display = 'flex'; // On force le flex pour l'alignement
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '10000';
    }
};

window.hideAuthPopup = function() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.style.display = 'none';
};

window.showCreateMatchPopup = function() {
    if (!localStorage.getItem('userId')) {
        alert("Action impossible : veuillez vous connecter.");
        window.showAuthPopup();
        return;
    }
    const popup = document.getElementById('popupMatch');
    if (popup) popup.style.display = 'flex';
};

/**
 * INITIALISATION AU CHARGEMENT
 */
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const logoutBtn = document.getElementById('logoutBtn');

    // 1. FORCE L'AFFICHAGE SI PAS DE SESSION
    if (!userId) {
        window.showAuthPopup();
        if (logoutBtn) logoutBtn.style.display = 'none';
    } else {
        window.hideAuthPopup();
        if (logoutBtn) logoutBtn.style.display = 'block';
    }

    // 2. CHARGEMENT SELON LA PAGE
    const isMatchPage = window.location.pathname.includes('matchs');
    if (userId) {
        if (isMatchPage) {
            if (typeof displayMatchs === "function") displayMatchs(userId);
        } else {
            loadUsersList(userId);
        }
    }

    // 3. GESTION DES ONGLETS (CONNEXION / INSCRIPTION)
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabType = btn.getAttribute('data-tab'); // 'login' ou 'register'
            
            // UI des boutons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Affichage des formulaires
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
                form.style.display = 'none';
            });

            const activeForm = document.getElementById(tabType + 'Form');
            if (activeForm) {
                activeForm.classList.add('active');
                activeForm.style.display = 'block';
            }
        });
    });

    // 4. CONNEXION
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const userVal = document.getElementById('login-username').value;
            const passVal = document.getElementById('login-password').value;

            fetch('/connexion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: userVal, password: passVal })
            })
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    localStorage.setItem('userId', data.user.id);
                    location.reload();
                } else {
                    alert(data.message || "Identifiants incorrects");
                }
            })
            .catch(err => console.error("Erreur connexion:", err));
        });
    }

    // 5. INSCRIPTION
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userVal = document.getElementById('register-username').value;
            const passVal = document.getElementById('register-password').value;

            fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginValue: userVal, passwordValue: passVal })
            })
            .then(res => res.json())
            .then(data => {
                alert("Compte créé ! Connectez-vous.");
                location.reload();
            })
            .catch(err => console.error("Erreur inscription:", err));
        });
    }

    // 6. DÉCONNEXION
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userId');
            location.reload();
        });
    }

});

//--- Création de match ---
document.getElementById('createMatchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const player1_id = localStorage.getItem('userId');
    const player2_id = document.getElementById('opponentSelect').value;
    const categorie = document.getElementById('gameSelect').value;
    if (player1_id) {
        alert(`Création du match contre l'utilisateur ${player2_id} pour le jeu ${categorie}`);
        action = "createMatch";
    } else {
        alert("Action impossible : veuillez vous connecter.");
        window.showAuthPopup();
        return;
    }
    if (!player1_id) {
        alert("veuillez sélectionner un adversaire et une catégorie.");
        return;
    }
     fetch('/createMatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player1_id, player2_id, categorie })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || "Match créé !");
        window.hideCreateMatchPopup();
        location.reload();
    })
    .catch(err => console.error("Erreur création match:", err));
});

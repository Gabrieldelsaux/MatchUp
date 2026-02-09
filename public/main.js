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
        overlay.sty

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

    // 7. CRÉATION DE MATCH
    const createMatchForm = document.getElementById('createMatchForm');
    if (createMatchForm) {
        createMatchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const p1 = localStorage.getItem('userId');
            const p2 = document.getElementById('userlist').value;
            const game = document.getElementById('gameSelect').value;

            if (!p2) return alert("Veuillez choisir un adversaire !");

            fetch('/createMatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player1_id: p1, player2_id: p2, categorie: game })
            })
            .then(res => res.json())
            .then(data => {
                alert("Invitation envoyée !");
                document.getElementById('popupMatch').style.display = 'none';
            })
            .catch(err => console.error("Erreur match:", err));
        });
    }
    invitationHandler();
});

function loadUsersList(currentUserId) {
    fetch('/users')
        .then(res => res.json())
        .then(users => {
            const select = document.getElementById('userlist');
            if (!select) return;
            select.innerHTML = '<option value="">-- Sélectionnez un adversaire --</option>';
            users.forEach(u => {
                if (u.id != currentUserId) {
                    const opt = document.createElement('option');
                    opt.value = u.id;
                    opt.text = u.login;
                    select.appendChild(opt);
                }
            });
        });
}

//---CREATION FONCTION POUR RECEVOIR LES INVITATIONS---
function invitationHandler() {
    console.log("Recherche des invitations...");
    
    fetch('/invitation') 
    .then(res => res.json())
    .then(matchs => {
        console.log("Données reçues :", matchs); // Vérifie ici dans ta console F12
        
        const receivedList = document.getElementById('received-invites');
        const sentList = document.getElementById('sent-invites');
        const currentUserId = localStorage.getItem('userId');

        if(!currentUserId) return console.error("Pas de userId dans le localStorage");

        receivedList.innerHTML = '';
        sentList.innerHTML = '';

        matchs.forEach(match => {
            // Vérifie bien l'orthographe 'statut' (avec un T)
            if (match.statut === 'en attente') {
                
                // CAS : Reçu (Je suis id_j2)
                if (match.id_j2 == currentUserId) {
                    addInvitation(receivedList, {
                        id: match.id,
                        playerName: "Joueur " + match.id_j1, 
                        gameType: match.categorie
                    }, true);
                }

                // CAS : Envoyé (Je suis id_j1)
                if (match.id_j1 == currentUserId) {
                    addInvitation(sentList, {
                        id: match.id,
                        playerName: "Joueur " + match.id_j2,
                        gameType: match.categorie
                    }, false);
                }
            }
        });
    })
    .catch(err => console.error("Erreur Fetch :", err));
}

// Lancement automatique
document.addEventListener('DOMContentLoaded', invitationHandler);
document.addEventListener('DOMContentLoaded', invitationHandler);



le.width = '100%';
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
    if (popup) {
        popup.style.display = 'flex';
        loadUsersList(localStorage.getItem('userId'));
    }
};
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
function addInvitation(invite) {
    const container = document.getElementById('received-invites');

    // Création de l'élément HTML
    const inviteHTML = `
        <div class="glass-card match-item" id="invite-${invite.id}">
            <div class="match-main">
                <div class="player-info">
                    <div class="avatar-mini" style="background-image: url('${invite.avatar}')"></div>
                    <div>
                        <span class="player-name">${invite.playerName}</span>
                        <span class="game-type">${invite.gameType}</span>
                    </div>
                </div>
                <div class="match-actions">
                    <button class="btn-icon accept" onclick="handleInvite(${invite.id}, 'accept')">✔</button>
                    <button class="btn-icon decline" onclick="handleInvite(${invite.id}, 'decline')">✖</button>
                </div>
            </div>
        </div>
    `;

    // Insertion au début de la liste (pour voir les nouvelles en premier)
    container.insertAdjacentHTML('afterbegin', inviteHTML);
}

//---INVITATIONS---
function invitationHandler() {
    fetch('/invitation') 
    .then(results => results.json())
    .then(matchs => {
        matchs.forEach(match => {
            if (match.status === 'en attente' && match.id_j1 == localStorage.getItem('userId')) {
                addInvitation({
                    id: match.id,
                    playerName: match.login_j2,
                    gameType: match.categorie
                });
            }
        });
    })
    .catch(err => console.error("Erreur chargement invitations:", err));
};


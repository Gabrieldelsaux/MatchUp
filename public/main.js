/**
 * MATCHUP - MAIN JAVASCRIPT
 * Regroupe la gestion de l'auth, des modales, des matchs et des invitations.
 */

// --- 1. FONCTIONS GLOBALES (Accessibles via HTML onclick) ---

// Gestion des Modales
function openAuth() { 
    document.getElementById("authModal").style.display = "block"; 
}

function closeAuth() { 
    document.getElementById("authModal").style.display = "none"; 
}

function closeMatchModal() { 
    document.getElementById("matchModal").style.display = "none"; 
}

function openMatchModal() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Connecte-toi d'abord !");
        return openAuth();
    }

    document.getElementById("matchModal").style.display = "block";

    // Charger la liste des adversaires
    fetch('/users')
        .then(res => res.json())
        .then(users => {
            const select = document.getElementById("opponentSelect");
            if (select) {
                select.innerHTML = '<option value="">-- Choisir un adversaire --</option>';
                users.forEach(u => {
                    // On ne s'affiche pas soi-même dans la liste
                    if (Number(u.id) !== Number(user.id)) {
                        select.innerHTML += `<option value="${u.id}">${u.login}</option>`;
                    }
                });
            }
        })
        .catch(err => console.error("Erreur chargement utilisateurs:", err));
}


// Action Accepter/Refuser (CORRIGÉE AVEC RELOAD)
function repondreMatch(idMatch, action, idJ1) {
    const route = action === 'accept' ? '/acceptMatch' : '/refuseMatch';
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return alert("Veuillez vous reconnecter.");

    fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_match: idMatch,
            id_j1: idJ1,
            id_j2: user.id
        })
    })
        .then(res => {
            if (res.ok) {
                alert(action === 'accept' ? "✅ Match accepté !" : "❌ Match refusé.");
                // Actualisation efficace et rapide pour mettre à jour l'interface
                window.location.reload();
            } else {
                alert("Erreur lors de la réponse au match.");
            }
        })
        .catch(err => console.error("Erreur action match:", err));
}

// Déconnexion
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}


// --- 2. LOGIQUE AU CHARGEMENT DU DOM ---
document.addEventListener("DOMContentLoaded", () => {
    console.log("MatchUp JS opérationnel");

    const user = JSON.parse(localStorage.getItem("user"));

    // Éléments du DOM
    const logoutBtn = document.getElementById("logoutBtn");
    const loginBtnNav = document.querySelector(".nav-cta");
    const registerBtn = document.getElementById("registerSubmit");
    const loginBtn = document.getElementById("loginBtn");
    const createMatchBtn = document.getElementById("createMatchBtn");

    // --- A. GESTION DE L'INSCRIPTION ---
    if (registerBtn) {
        registerBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const username = document.getElementById("usernameInput").value;
            const password = document.getElementById("passwordInput").value;

            fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loginValue: username, passwordValue: password }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert("Compte créé avec succès ! Tu peux maintenant te connecter.");
                        closeAuth();
                    } else {
                        alert("Erreur : " + data.message);
                    }
                });
        });
    }

    // --- B. GESTION DE L'INTERFACE UTILISATEUR (NAVBAR) ---
    if (user) {
        if (loginBtnNav) loginBtnNav.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline-block";
    } else {
        if (loginBtnNav) loginBtnNav.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";
    }

    // 1. La fonction qui va chercher les données et met à jour uniquement le HTML
    function updateInvitationsOnly() {
        const user = JSON.parse(localStorage.getItem("user"));
        const receivedList = document.getElementById("received-invites");
        const sentList = document.getElementById("sent-invites");
        const sentMatchs = document.getElementById("ongoing-matches");

        // Si l'utilisateur n'est pas connecté ou si les div n'existent pas, on arrête
        if (!user || !receivedList || !sentList) return;

        fetch('/invitation')
            .then(res => res.json())
            .then(matchs => {
                let receivedHTML = "";
                let sentHTML = "";
                let countReceived = 0;
                let countSent = 0;
                let matchsHTML = "";
                let countmatchs = 0;

                matchs.forEach(m => {
                    const userId = Number(user.id);
                    const j1 = m.Login1;
                    const j2 = m.login2;
                    const p1 = Number(m.id_j1);
                    const p2 = Number(m.id_j2);

                    // Cas 1 : Reçues
                    if (p2 === userId && m.statut === "en_attente") {
                        countReceived++;
                        receivedHTML += `
                            <div class="match-item">
                                <span class="invite-text">🎮 <b>${j1}</b> vous a invité à jouer à ${m.categorie.toUpperCase()}</span>
                                <div class="match-actions">
                                    <button class="btn-accept" onclick="repondreMatch(${m.id},'accept', ${m.id_j1}); window.location.reload();">Accepter</button>
                                    <button class="btn-refuse" onclick="repondreMatch(${m.id}, 'refuse', ${m.id_j1}); window.location.reload();">Refuser</button>
                                </div>
                            </div>`;
                    }
                    // Cas 2 : Envoyées
                    else if (p1 === userId && m.statut === "en_attente") {
                        countSent++;
                        sentHTML += `
                            <div class="match-item">
                                <span class="invite-text">🚀 Vous avez invité <b>${j2}</b> à jouer à ${m.categorie.toUpperCase()}</span>
                                <div class="status-waiting">🚀 En attente de réponse...</div>
                            </div>`;
                    }

                    // si le match est en cours il va dans l'espace Matchs en cours 
                    if (p1 === userId && m.statut === "en_cours") {
                        countmatchs++;
                        matchsHTML += `
                            <div class="ongoing-matches-grid" id="ongoing-matches">
                                <div class="match-card">
                                    <div class="match-header">
                                        <div class="player-info">
                                            <div class="player-avatar">JD</div>
                                            <div class="player-details">
                                                <h3 class="player-name">${j2}</h3>
                                                <span class="game-category">${m.categorie.toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div class="match-status">
                                            <span class="status-badge ongoing">En cours</span>
                                        </div>
                                    </div>
                                    <div class="match-result">
                                        <label for="result-1">Résultat du match :</label>
                                        <select id="result-1" class="result-select">
                                            <option value="" selected disabled>-- Sélectionner --</option>
                                            <option value="win">✅ Gagné</option>
                                            <option value="loss">❌ Perdu</option>
                                        </select>
                                    </div>
                                    <button class="btn-validate">Valider le résultat</button>
                                </div>
                            </div>`;
                    } 
                    else if (p2 === userId && m.statut === "en_cours") {
                        countmatchs++;
                        matchsHTML += `
                            <div class="ongoing-matches-grid" id="ongoing-matches">
                                <div class="match-card">
                                    <div class="match-header">
                                        <div class="player-info">
                                            <div class="player-avatar">JD</div>
                                            <div class="player-details">
                                                <h3 class="player-name">${j1}</h3>
                                                <span class="game-category">${m.categorie.toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div class="match-status">
                                            <span class="status-badge ongoing">En cours</span>
                                        </div>
                                    </div>
                                    <div class="match-result">
                                        <label for="result-1">Résultat du match :</label>
                                        <select id="result-1" class="result-select">
                                            <option value="" selected disabled>-- Sélectionner --</option>
                                            <option value="win">✅ Gagné</option>
                                            <option value="loss">❌ Perdu</option>
                                        </select>
                                    </div>
                                    <button class="btn-validate">Valider le résultat</button>
                                </div>
                            </div>`;
                    }
                });

                // Injection du contenu sans recharger la page
                if (sentMatchs) {
                    sentMatchs.innerHTML = countmatchs > 0 ? matchsHTML : "<p style='opacity:0.5;'>Aucun match en cours.</p>";
                }
                receivedList.innerHTML = countReceived > 0 ? receivedHTML : "<p style='opacity:0.5;'>Aucune invitation reçue.</p>";
                sentList.innerHTML = countSent > 0 ? sentHTML : "<p style='opacity:0.5;'>Aucun défi envoyé.</p>";
            })
            .catch(err => console.error("Erreur chargement invitations:", err));
    }
updateInvitationsOnly();
    

    // --- D. CONNEXION (LOGIN) ---
    if (loginBtn) {
        loginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const username = document.getElementById("loginUsernameInput").value;
            const password = document.getElementById("loginPasswordInput").value;

            fetch("/connexion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login: username, password: password }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        localStorage.setItem("user", JSON.stringify(data.user));
                        location.reload();
                    } else {
                        alert("Identifiants incorrects");
                    }
                });
        });
    }

    // --- E. CRÉATION DE MATCH ---
    if (createMatchBtn) {
        createMatchBtn.addEventListener("click", () => {
            const game = document.getElementById("gameSelect").value;
            const oppId = document.getElementById("opponentSelect").value;
            if (!oppId) return alert("Choisis un adversaire !");

            createMatchBtn.disabled = true;
            createMatchBtn.innerText = "Envoi...";

            fetch("/createMatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ player1_id: user.id, player2_id: oppId, categorie: game }),
            })
                .then(res => {
                    if (res.ok) {
                        alert("🚀 Défi envoyé !");
                        window.location.href = "matchs.html";
                    } else {
                        createMatchBtn.disabled = false;
                        createMatchBtn.innerText = "Lancer le défi";
                    }
                })
                .catch(() => {
                    createMatchBtn.disabled = false;
                    createMatchBtn.innerText = "Lancer le défi";
                });
        });
    }
});

// --- 1. FONCTIONS GLOBALES (Accessibles partout) ---

// Gestion de l'affichage des Modales
function openAuth() { document.getElementById("authModal").style.display = "block"; }
function closeAuth() { document.getElementById("authModal").style.display = "none"; }

function openMatchModal() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { alert("Connecte-toi d'abord !"); return openAuth(); }

    document.getElementById("matchModal").style.display = "block";

    fetch('/users')
        .then(res => res.json())
        .then(users => {
            const select = document.getElementById("opponentSelect");
            if (select) {
                select.innerHTML = '<option value="">-- Choisir un adversaire --</option>';
                users.forEach(u => {
                    if (Number(u.id) !== Number(user.id)) {
                        select.innerHTML += `<option value="${u.id}">${u.login}</option>`;
                    }
                });
            }
        });
}

function closeMatchModal() { document.getElementById("matchModal").style.display = "none"; }

// Fonction pour Accepter ou Refuser un match
function repondreMatch(idMatch, action) {
    const route = action === 'accept' ? '/acceptMatch' : '/refuseMatch';
    const user = JSON.parse(localStorage.getItem("user"));

    fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_match: idMatch,
            id_j2: user.id
        })
    })
        .then(res => {
            if (res.ok) {
                alert(action === 'accept' ? "Match accepté ! Bonne chance." : "Match refusé.");
                location.reload();
            }
        })
        .catch(err => console.error("Erreur action:", err));
}

// --- 2. LOGIQUE AU CHARGEMENT DU DOM ---
document.addEventListener("DOMContentLoaded", () => {
    console.log("MatchUp JS opérationnel");

    const user = JSON.parse(localStorage.getItem("user"));
    const receivedList = document.getElementById("received-invites");
    const sentList = document.getElementById("sent-invites");

    // --- A. GESTION DE L'AFFICHAGE DES MATCHS ---
    if (receivedList && user) {
        fetch('/invitation')
            .then(res => res.json())
            .then(matchs => {
                receivedList.innerHTML = "";
                sentList.innerHTML = "";

                let countReceived = 0;
                let countSent = 0;

                matchs.forEach(m => {
                    const userId = Number(user.id);
                    const p1 = Number(m.id_j1);
                    const p2 = Number(m.id_j2);

                    // Reçu (Je suis Player 2)
                    if (p2 === userId && m.status === "en attente") {
                        countReceived++;
                        receivedList.innerHTML += `
                            <div class="glass-card match-item" style="padding:15px; margin-bottom:10px; border-left: 4px solid #00d4ff; background: rgba(255,255,255,0.03);">
                                <span>🎮 <b>${m.categorie.toUpperCase()}</b> de Joueur #${m.id_j1}</span>
                                <div style="margin-top:10px;">
                                    <button onclick="repondreMatch(${m.id}, 'accept')" style="background:#2ecc71; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Accepter</button>
                                    <button onclick="repondreMatch(${m.id}, 'refuse')" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-left:5px;">Refuser</button>
                                </div>
                            </div>`;
                    }
                    // Envoyé (Je suis Player 1)
                    else if (p1 === userId && m.status === "en attente") {
                        countSent++;
                        sentList.innerHTML += `
                            <div class="glass-card match-item" style="padding:15px; margin-bottom:10px; border-left: 4px solid #ff007a; background: rgba(255,255,255,0.03);">
                                <span>🚀 <b>${m.categorie.toUpperCase()}</b> envoyé à Joueur #${m.id_j2}</span>
                                <div style="font-size:0.8em; opacity:0.6; margin-top:5px;">En attente de réponse...</div>
                            </div>`;
                    }
                });

                if (countReceived === 0) receivedList.innerHTML = "<p style='opacity:0.5;'>Aucune invitation reçue.</p>";
                if (countSent === 0) sentList.innerHTML = "<p style='opacity:0.5;'>Aucun défi envoyé.</p>";
            });
    }
    // --- CREATION DE COMPTE ---
    const btnSignup = document.getElementById("registerSubmit");
    if (btnSignup) {
        btnSignup.addEventListener("click", (e) => {
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
                    if (data.user) {
                        localStorage.setItem("user", JSON.stringify(data.user));
                        location.reload();
                    } else { alert("Erreur lors de l'inscription"); }
                });
        });
    }
    // --- B. CONNEXION ---
    const btnLogin = document.getElementById("loginBtn");
    if (btnLogin) {
        btnLogin.addEventListener("click", (e) => {
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
                    } else { alert("Erreur identifiants"); }
                });
        });
    }

    // --- C. CRÉATION DE MATCH ---
    const btnCreate = document.getElementById("createMatchBtn");
    if (btnCreate) {
        btnCreate.addEventListener("click", () => {
            const game = document.getElementById("gameSelect").value;
            const oppId = document.getElementById("opponentSelect").value;
            if (!oppId) return alert("Choisis un adversaire !");

            btnCreate.disabled = true;
            btnCreate.innerText = "Envoi...";

            fetch("/createMatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ player1_id: user.id, player2_id: oppId, categorie: game }),
            })
                // Dans ton bloc --- C. CRÉATION DE MATCH ---
                .then(res => {
                    if (res.ok) {
                        alert("🚀 Défi envoyé !");
                        window.location.href = "matchs.html";
                    } else {
                        // AJOUTE CECI : Si le serveur répond avec une erreur (ex: 500)
                        alert("Erreur serveur (Base de données probablement injoignable)");
                        btnCreate.disabled = false;
                        btnCreate.innerText = "Lancer le défi";
                    }
                })
                .catch((err) => {
                    // Ceci s'exécute si la requête échoue complètement
                    console.error(err);
                    btnCreate.disabled = false;
                    btnCreate.innerText = "Lancer le défi";
                    alert("Impossible de contacter le serveur.");
                });
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const logoutBtn = document.getElementById("logoutBtn");
    const loginBtnNav = document.querySelector(".nav-cta");

    if (user) {
        // État : CONNECTÉ
        if (loginBtnNav) loginBtnNav.style.display = "none";    // Cache Connexion
        if (logoutBtn) logoutBtn.style.display = "inline-block"; // Montre Déconnexion
    } else {
        // État : DÉCONNECTÉ
        if (loginBtnNav) loginBtnNav.style.display = "inline-block"; // Montre Connexion
        if (logoutBtn) logoutBtn.style.display = "none";             // Cache Déconnexion
    }
});

// N'oublie pas la fonction logout
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html"; // Redirige et rafraîchit
}

const monButton = document.getElementById("registerSubmit");

/**
 * MATCHUP - MAIN JAVASCRIPT
 * Regroupe la gestion de l'auth, des modales et des matchs.
 */

// --- 1. FONCTIONS GLOBALES (Accessibles via HTML) ---

// Gestion des Modales
function openAuth() { document.getElementById("authModal").style.display = "block"; }
function closeAuth() { document.getElementById("authModal").style.display = "none"; }
function closeMatchModal() { document.getElementById("matchModal").style.display = "none"; }

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

// Action Accepter/Refuser
function repondreMatch(idMatch, action, idJ1) {
    const route = action === 'accept' ? '/acceptMatch' : '/refuseMatch';
    const user = JSON.parse(localStorage.getItem("user"));

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
            location.reload();
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



//--- Crée un compte ---
if (monButton) {
    monButton.addEventListener("click", (e) => {
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
            if (data.message) {
                alert("Compte créé avec succès ! Tu peux maintenant te connecter.");
                closeAuth();
            } else {
                alert("Erreur lors de la création du compte : " + data.message);
            }
        });
    } 
)};

// --- 2. LOGIQUE AU CHARGEMENT DU DOM ---
document.addEventListener("DOMContentLoaded", () => {
    console.log("MatchUp JS opérationnel");

    const user = JSON.parse(localStorage.getItem("user"));
    const logoutBtn = document.getElementById("logoutBtn");
    const loginBtnNav = document.querySelector(".nav-cta");

    // --- A. GESTION DE L'INTERFACE UTILISATEUR (NAVBAR) ---
    if (user) {
        if (loginBtnNav) loginBtnNav.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline-block";
    } else {
        if (loginBtnNav) loginBtnNav.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";
    }

    // --- B. GESTION DES INVITATIONS (MATCHS.HTML) ---
    const receivedList = document.getElementById("received-invites");
    const sentList = document.getElementById("sent-invites");

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

                    // Cas 1 : Invitation reçue (Je suis J2)
                    if (p2 === userId && m.status === "en attente") {
                        countReceived++;
                        const template = document.getElementById("template-invitation-recue");
                        if (template) {
                            const clone = template.content.cloneNode(true);
                            clone.querySelector(".invite-text").innerHTML = `🎮 <b>${m.categorie.toUpperCase()}</b> de Joueur #${m.id_j1}`;
                            clone.querySelector(".btn-accept").onclick = () => repondreMatch(m.id, 'accept', m.id_j1);
                            clone.querySelector(".btn-refuse").onclick = () => repondreMatch(m.id, 'refuse', m.id_j1);
                            receivedList.appendChild(clone);
                        }
                    } 
                    // Cas 2 : Défi envoyé (Je suis J1)
                    else if (p1 === userId && m.status === "en attente") {
                        countSent++;
                        const template = document.getElementById("template-invitation-envoyee");
                        if (template) {
                            const clone = template.content.cloneNode(true);
                            clone.querySelector(".invite-text").innerHTML = `🚀 <b>${m.categorie.toUpperCase()}</b> envoyé à Joueur #${m.id_j2}`;
                            sentList.appendChild(clone);
                        }
                    }
                });

                if (countReceived === 0) receivedList.innerHTML = "<p style='opacity:0.5;'>Aucune invitation reçue.</p>";
                if (countSent === 0) sentList.innerHTML = "<p style='opacity:0.5;'>Aucun défi envoyé.</p>";
            })
            .catch(err => console.error("Erreur invitations:", err));
    }

    // --- C. CONNEXION (LOGIN) ---
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
                } else { alert("Identifiants incorrects"); }
            });
        });
    }

    // --- D. CRÉATION DE MATCH ---
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
            .then(res => {
                if (res.ok) {
                    alert("🚀 Défi envoyé !");
                    window.location.href = "matchs.html";
                } else {
                    btnCreate.disabled = false;
                    btnCreate.innerText = "Lancer le défi";
                }
            })
            .catch(() => {
                btnCreate.disabled = false;
                btnCreate.innerText = "Lancer le défi";
            });
        });
    }
});
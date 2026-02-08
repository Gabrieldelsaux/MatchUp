// --- 1. GESTION DES POPUPS ---
function openAuth() { 
    document.getElementById("authModal").style.display = "block"; 
}

function closeAuth() { 
    document.getElementById("authModal").style.display = "none"; 
}

function openMatchModal() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Connecte-toi d'abord !");
        return openAuth();
    }
    
    document.getElementById("matchModal").style.display = "block";
    
    // Charger la liste des joueurs pour le menu déroulant
    fetch('/users')
        .then(res => res.json())
        .then(users => {
            const select = document.getElementById("opponentSelect");
            select.innerHTML = '<option value="">-- Choisir un adversaire --</option>';
            users.forEach(u => {
                if (u.id !== user.id) { // On ne s'affiche pas soi-même
                    select.innerHTML += `<option value="${u.id}">${u.login}</option>`;
                }
            });
        });
}

function closeMatchModal() { 
    document.getElementById("matchModal").style.display = "none"; 
}

// --- 2. LOGIQUE AU CHARGEMENT DE LA PAGE ---
document.addEventListener("DOMContentLoaded", () => {

    // --- INSCRIPTION ---
    const btnRegister = document.getElementById("registerSubmit");
    if (btnRegister) {
        btnRegister.addEventListener("click", (e) => {
            e.preventDefault();
            const username = document.getElementById("usernameInput").value;
            const password = document.getElementById("passwordInput").value;

            fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loginValue: username, passwordValue: password }),
            })
            .then(r => r.json())
            .then(() => {
                alert("Inscription réussie ! Tu peux maintenant te connecter.");
            })
            .catch(err => alert("Erreur lors de l'inscription"));
        });
    }

    // --- CONNEXION ---
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
            .then(res => {
                if (!res.ok) throw new Error("Identifiants incorrects");
                return res.json();
            })
            .then(data => {
                localStorage.setItem("user", JSON.stringify(data.user));
                alert("Bon retour, " + data.user.login + " !");
                location.reload(); 
            })
            .catch(err => alert(err.message));
        });
    }

    // --- CRÉATION DE MATCH (BOUTON LANCER LE DÉFI) ---
    const btnCreate = document.getElementById("createMatchBtn");
    if (btnCreate) {
        btnCreate.addEventListener("click", () => {
            const game = document.getElementById("gameSelect").value;
            const oppId = document.getElementById("opponentSelect").value;
            const user = JSON.parse(localStorage.getItem("user"));

            if (!oppId) return alert("Choisis un adversaire !");

            fetch("/createMatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    player1_id: user.id, 
                    player2_id: oppId, 
                    categorie: game 
                }),
            })
            .then(res => {
                if(res.ok) {
                    alert("🚀 Défi envoyé !");
                    window.location.href = "/matchs";
                }
            });
        });
    }

    // --- AFFICHAGE DES INVITATIONS (SUR LA PAGE MATCHS.HTML) ---
    const receivedList = document.getElementById("received-invites");
    if (receivedList) {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        fetch('/invitation')
            .then(res => res.json())
            .then(matchs => {
                const received = document.getElementById("received-invites");
                const sent = document.getElementById("sent-invites");
                
                received.innerHTML = "";
                sent.innerHTML = "";

                matchs.forEach(m => {
                    // Si je suis celui qui reçoit (Invitations Reçues)
                    if (m.id_j2 === user.id && m.status === "en attente") {
                        received.innerHTML += `
                            <div class="glass-card match-item">
                                <span>Défis <b>${m.categorie}</b> par Joueur #${m.id_j1}</span>
                            </div>`;
                    } 
                    // Si je suis celui qui a envoyé (Défis Envoyés)
                    else if (m.id_j1 === user.id && m.status === "en attente") {
                        sent.innerHTML += `
                            <div class="glass-card match-item">
                                <span>Défis <b>${m.categorie}</b> envoyé à Joueur #${m.id_j2}</span>
                            </div>`;
                    }
                });
            });
    }
});

// Fermer les popups avec la touche Echap
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        closeAuth();
        closeMatchModal();
    }
});
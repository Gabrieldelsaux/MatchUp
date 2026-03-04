// ============================================================
// MODALES
// ============================================================

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
    if (!user) return openAuth();

    document.getElementById("matchModal").style.display = "block";

    fetch('/users')
        .then(res => res.json())
        .then(users => {
            const select = document.getElementById("opponentSelect");
            if (select) {
                select.innerHTML = '<option value="">-- Choisir un adversaire --</option>';
                users.forEach(u => {
                    if (Number(u.id) !== Number(user.id)) {
                        select.innerHTML += '<option value="' + u.id + '">' + u.login + '</option>';
                    }
                });
            }
        })
        .catch(err => console.error("Erreur chargement utilisateurs:", err));
}


// ============================================================
// ACCEPTER / REFUSER UN MATCH
// ============================================================

function repondreMatch(idMatch, action, idJ1) {
    const route = action === 'accept' ? '/acceptMatch' : '/refuseMatch';
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_match: idMatch, id_j1: idJ1, id_j2: user.id })
    })
    .then(res => {
        if (res.ok) {
            window.location.reload();
        } else {
            alert("Erreur lors de la réponse au match.");
        }
    })
    .catch(err => console.error("Erreur action match:", err));
}


// ============================================================
// DÉCONNEXION
// ============================================================

function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}


// ============================================================
// CHARGEMENT DU DOM
// ============================================================

document.addEventListener("DOMContentLoaded", function() {
    console.log("MatchUp JS opérationnel");

    var user           = JSON.parse(localStorage.getItem("user"));
    var logoutBtn      = document.getElementById("logoutBtn");
    var loginBtnNav    = document.querySelector(".nav-cta");
    var registerBtn    = document.getElementById("registerSubmit");
    var loginBtn       = document.getElementById("loginBtn");
    var createMatchBtn = document.getElementById("createMatchBtn");


    // --- INSCRIPTION ---
    if (registerBtn) {
        registerBtn.addEventListener("click", function(e) {
            e.preventDefault();
            var username = document.getElementById("usernameInput").value;
            var password = document.getElementById("passwordInput").value;

            fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loginValue: username, passwordValue: password })
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


    // --- NAVBAR : affichage selon connexion ---
    if (user) {
        if (loginBtnNav) loginBtnNav.style.display = "none";
        if (logoutBtn)   logoutBtn.style.display   = "inline-block";
    } else {
        if (loginBtnNav) loginBtnNav.style.display = "inline-block";
        if (logoutBtn)   logoutBtn.style.display   = "none";
    }


    // --- CHARGEMENT PRINCIPAL ---
    // Charge invitations reçues/envoyées, matchs en cours ET historique
    function updateAll() {
        var currentUser = JSON.parse(localStorage.getItem("user"));
        if (!currentUser) return;

        fetch('/invitation')
        .then(res => res.json())
        .then(function(matchs) {
            var userId = Number(currentUser.id);

            var receivedHTML  = "";
            var sentHTML      = "";
            var ongoingHTML   = "";
            var historyHTML   = "";
            var countReceived = 0;
            var countSent     = 0;
            var countOngoing  = 0;
            var countHistory  = 0;

            matchs.forEach(function(m) {
                var j1 = m.Login1;
                var j2 = m.login2;
                var p1 = Number(m.id_j1);
                var p2 = Number(m.id_j2);

                // ── Invitations reçues ────────────────────────────
                if (p2 === userId && m.statut === "en_attente") {
                    countReceived++;
                    receivedHTML +=
                        '<div class="match-item">' +
                            '<span class="invite-text">🎮 <b>' + j1 + '</b> vous a invité à jouer à ' + m.categorie.toUpperCase() + '</span>' +
                            '<div class="match-actions">' +
                                '<button class="btn-accept" onclick="repondreMatch(' + m.id + ',\'accept\',' + m.id_j1 + ')">Accepter</button>' +
                                '<button class="btn-refuse" onclick="repondreMatch(' + m.id + ',\'refuse\',' + m.id_j1 + ')">Refuser</button>' +
                            '</div>' +
                        '</div>';
                }

                // ── Invitations envoyées ──────────────────────────
                else if (p1 === userId && m.statut === "en_attente") {
                    countSent++;
                    sentHTML +=
                        '<div class="match-item">' +
                            '<span class="invite-text">🚀 Vous avez invité <b>' + j2 + '</b> à jouer à ' + m.categorie.toUpperCase() + '</span>' +
                            '<div class="status-waiting">🚀 En attente de réponse...</div>' +
                        '</div>';
                }

                // ── Matchs en cours ───────────────────────────────
                if (m.statut === "en_cours" && (p1 === userId || p2 === userId)) {
                    countOngoing++;
                    var adversaire    = (p1 === userId) ? j2 : j1;
                    var opponentId    = (p1 === userId) ? p2 : p1;
                    var avatarLetters = adversaire.substring(0, 2).toUpperCase();

                    ongoingHTML +=
                        '<div class="match-card" data-match-id="' + m.id + '" data-opponent-id="' + opponentId + '">' +
                            '<div class="match-header">' +
                                '<div class="player-info">' +
                                    '<div class="player-avatar">' + avatarLetters + '</div>' +
                                    '<div class="player-details">' +
                                        '<h3 class="player-name">' + adversaire + '</h3>' +
                                        '<span class="game-category">' + m.categorie.toUpperCase() + '</span>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="match-status">' +
                                    '<span class="status-badge ongoing">En cours</span>' +
                                '</div>' +
                            '</div>' +
                            '<div class="match-result">' +
                                '<label for="result-' + m.id + '">Résultat du match :</label>' +
                                '<select id="result-' + m.id + '" class="result-select">' +
                                    '<option value="" selected disabled>-- Sélectionner --</option>' +
                                    '<option value="win">gagné</option>' +
                                    '<option value="loss">perdu</option>' +
                                '</select>' +
                            '</div>' +
                            '<button class="btn-validate">Valider le résultat</button>' +
                        '</div>';
                }

                // ── Historique (matchs terminés) ──────────────────
                if (m.statut === "termine" && (p1 === userId || p2 === userId)) {
                    countHistory++;
                    var adversaireH   = (p1 === userId) ? j2 : j1;
                    var resultat      = "—";
                    var resultatClass = "";
                    var isJ1          = (p1 === userId);

                    if (isJ1) {
                        // On est joueur 1 : on lit score_j1
                        if (m.score_j1) {
                            resultat      = m.score_j1 === "gagné" ? "✅ Gagné" : "❌ Perdu";
                            resultatClass = m.score_j1 === "gagné" ? "result-win" : "result-loss";
                        }
                    } else {
                        // On est joueur 2 : on lit score_j2
                        if (m.score_j2) {
                            resultat      = m.score_j2 === "gagné" ? "✅ Gagné" : "❌ Perdu";
                            resultatClass = m.score_j2 === "gagné" ? "result-win" : "result-loss";
                        }
                    }

                    historyHTML +=
                        '<tr>' +
                            '<td>' + adversaireH + '</td>' +
                            '<td class="' + resultatClass + '">' + resultat + '</td>' +
                            '<td>' + (m.categorie ? m.categorie.toUpperCase() : "—") + '</td>' +
                        '</tr>';
                }
            });

            // ── Injection dans le DOM ─────────────────────────────
            var receivedList = document.getElementById("received-invites");
            var sentList     = document.getElementById("sent-invites");
            var ongoingEl    = document.getElementById("ongoing-matches");
            var historyBody  = document.getElementById("history-body");

            if (receivedList) {
                receivedList.innerHTML = countReceived > 0
                    ? receivedHTML
                    : "<p style='opacity:0.5;'>Aucune invitation reçue.</p>";
            }
            if (sentList) {
                sentList.innerHTML = countSent > 0
                    ? sentHTML
                    : "<p style='opacity:0.5;'>Aucun défi envoyé.</p>";
            }
            if (ongoingEl) {
                ongoingEl.innerHTML = countOngoing > 0
                    ? ongoingHTML
                    : "<p style='opacity:0.5;'>Aucun match en cours.</p>";
            }
            if (historyBody) {
                historyBody.innerHTML = countHistory > 0
                    ? historyHTML
                    : '<tr><td colspan="3" style="opacity:0.5; text-align:center; padding:20px;">Aucun match terminé pour l\'instant.</td></tr>';
            }
        })
        .catch(err => console.error("Erreur chargement données:", err));
    }

    updateAll();


    // --- CONNEXION ---
    if (loginBtn) {
        loginBtn.addEventListener("click", function(e) {
            e.preventDefault();
            var username = document.getElementById("loginUsernameInput").value;
            var password = document.getElementById("loginPasswordInput").value;

            fetch("/connexion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login: username, password: password })
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


    // --- CRÉATION DE MATCH ---
    if (createMatchBtn) {
        createMatchBtn.addEventListener("click", function() {
            var game  = document.getElementById("gameSelect").value;
            var oppId = document.getElementById("opponentSelect").value;
            if (!oppId) return;

            createMatchBtn.disabled  = true;
            createMatchBtn.innerText = "Envoi...";

            fetch("/createMatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ player1_id: user.id, player2_id: oppId, categorie: game })
            })
            .then(res => {
                if (res.ok) {
                    window.location.href = "matchs.html";
                } else {
                    alert("Erreur lors de la création du match.");
                    createMatchBtn.disabled  = false;
                    createMatchBtn.innerText = "Lancer le défi";
                }
            })
            .catch(function() {
                alert("Erreur réseau lors de la création du match.");
                createMatchBtn.disabled  = false;
                createMatchBtn.innerText = "Lancer le défi";
            });
        });
    }

});


// ============================================================
// VALIDATION DU RÉSULTAT D'UN MATCH
// ============================================================

document.addEventListener("click", function(e) {
    if (!e.target.classList.contains("btn-validate")) return;

    var user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    var matchCard   = e.target.closest(".match-card");
    var matchId     = parseInt(matchCard.getAttribute("data-match-id"));
    var opponentId  = parseInt(matchCard.getAttribute("data-opponent-id"));
    var resultValue = matchCard.querySelector(".result-select").value;

    if (!resultValue) {
        alert("Veuillez sélectionner un résultat.");
        return;
    }

    // Désactiver le bouton pour éviter les doubles-clics
    e.target.disabled  = true;
    e.target.innerText = "Envoi...";

    var isPlayer1Global = false;

    fetch('/invitation')
    .then(res => res.json())
    .then(function(matchs) {
        var matchInfo = matchs.find(m => m.id === matchId);
        if (!matchInfo) throw new Error("Match introuvable");

        isPlayer1Global = Number(matchInfo.id_j1) === Number(user.id);
        var score       = resultValue === "win" ? "gagné" : "perdu";
        var scoreRoute  = isPlayer1Global ? '/changeScoreJ1' : '/changeScoreJ2';
        var scoreBody   = isPlayer1Global
            ? { score_j1: score, id_match: matchId }
            : { score_j2: score, id_match: matchId };

        return fetch(scoreRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scoreBody)
        });
    })
    .then(function() {
        return fetch('/getscore').then(res => res.json());
    })
    .then(function(scores) {
        var match = scores.find(m => m.id === matchId);
        if (!match) throw new Error("Score introuvable");

        console.log("Score J1:", match.score_j1, "| Score J2:", match.score_j2);

        var hasJ1 = match.score_j1 && String(match.score_j1).toLowerCase() !== 'null';
        var hasJ2 = match.score_j2 && String(match.score_j2).toLowerCase() !== 'null';

        if (hasJ1 && hasJ2) {

            // Vérification cohérence : impossible que les deux aient déclaré la même chose
            if (match.score_j1 === match.score_j2) {
                console.warn("Résultats incohérents !");
                alert("Résultats incohérents. Veuillez vérifier. Si le problème persiste, contactez le support.");
                window.location.reload();
                return { success: false };
            }

            console.log("Les deux joueurs ont validé !");
            var gagnant = resultValue === "win" ? user.id : opponentId;

            return fetch('/finishMatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_match: matchId, gagnant: gagnant })
            }).then(res => res.json());

        } else {
            console.log("En attente du second joueur");
            alert("Résultat enregistré, en attente de l'autre joueur...");
            window.location.reload();
            return { success: false };
        }
    })
    .then(function(data) {
        if (data && data.success) {
            alert("Match terminé !");
            window.location.reload();
        }
    })
    .catch(function(err) {
        console.error("Erreur validation:", err);
        alert("Erreur : " + err.message);
        e.target.disabled  = false;
        e.target.innerText = "Valider le résultat";
    });
});
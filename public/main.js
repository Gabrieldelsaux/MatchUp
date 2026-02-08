// Fonctions de la Popup
function openAuth() { document.getElementById("authModal").style.display = "block"; }
function closeAuth() { document.getElementById("authModal").style.display = "none"; }

// Ouvrir au démarrage si l'utilisateur n'est pas connecté
window.onload = () => {
    if (!localStorage.getItem("user")) {
        setTimeout(openAuth, 1000); // S'ouvre après 1 seconde
    }
};

// --- TES SCRIPTS FETCH CORRIGÉS ---

const BoutonRegister = document.getElementById("registerSubmit");
const BoutonLogin = document.getElementById("loginBtn");

BoutonRegister.addEventListener("click", function (event) {
    event.preventDefault();
    const username = document.getElementById("usernameInput").value;
    const password = document.getElementById("passwordInput").value;

    fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginValue: username, passwordValue: password }),
    })
    .then(r => r.json())
    .then(data => {
        alert("Inscription réussie ! Connecte-toi maintenant.");
    });
});

BoutonLogin.addEventListener("click", function (event) {
    event.preventDefault();
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
        // ✅ CORRECTION : On enregistre l'objet user complet
        localStorage.setItem("user", JSON.stringify(data.user)); 
        alert("Bon retour, " + data.user.login + " !");
    })
    .catch(err => alert(err.message));
});
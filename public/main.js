const BoutonRegister = document.getElementById("registerSubmit");
const BoutonLogin = document.getElementById("loginBtn");

// INSCRIPTION
BoutonRegister.addEventListener("click", function (event) {
  event.preventDefault();
  const username = document.getElementById("usernameInput").value;
  const password = document.getElementById("passwordInput").value;

  fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ loginValue: username, passwordValue: password }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      alert("Inscription réussie !");
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Erreur lors de l'inscription.");
    });
});

// CONNEXION ET AFFICHAGE DANS LOCALSTORAGE
BoutonLogin.addEventListener("click", function (event) {
  event.preventDefault();
  const username = document.getElementById("loginUsernameInput").value;
  const password = document.getElementById("loginPasswordInput").value;

  fetch("/connexion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ login: username, password: password }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Identifiants invalides");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Success:", data);
      localStorage.setItem("user", JSON.stringify(data[0]));
      alert("Connexion réussie !");
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Erreur lors de la connexion.");
    });
});
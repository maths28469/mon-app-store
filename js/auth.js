// auth.js - Gestion de l'authentification

// Simule une base de données d'utilisateurs (à remplacer par une vraie base de données)
let users = JSON.parse(localStorage.getItem('appstore_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('appstore_current_user')) || null;

// Initialiser les écouteurs d'événements pour les formulaires d'authentification
document.addEventListener('DOMContentLoaded', () => {
    // Formulaire de connexion dans le modal
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            login(email, password);
        });
    }

    // Formulaire d'inscription
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            register(name, email, password, confirmPassword);
        });
    }

    // Mise à jour de l'interface selon l'état de connexion
    updateAuthUI();
});

// Vérifier si l'utilisateur est connecté
function checkAuthStatus() {
    return currentUser !== null;
}

// Mettre à jour l'interface selon l'état de connexion
function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.querySelector('.register-btn');

    if (checkAuthStatus()) {
        // L'utilisateur est connecté
        if (loginBtn) {
            loginBtn.textContent = currentUser.name;
            loginBtn.href = '#';

            // Ajouter un menu déroulant pour le profil et la déconnexion
            const dropdownMenu = document.createElement('div');
            dropdownMenu.className = 'dropdown-menu';
            dropdownMenu.innerHTML = `
                <ul>
                    <li><a href="#" id="profile-link">Mon Profil</a></li>
                    <li><a href="#" id="logout-link">Déconnexion</a></li>
                </ul>
            `;

            // Ajouter le menu après le bouton de connexion
            loginBtn.parentNode.appendChild(dropdownMenu);

            // Ajouter les événements pour le menu
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
            }

            // Afficher/cacher le menu au clic sur le nom d'utilisateur
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                dropdownMenu.classList.toggle('show');
            });
        }

        // Cacher le bouton d'inscription si l'utilisateur est connecté
        if (registerBtn) {
            registerBtn.style.display = 'none';
        }
    } else {
        // L'utilisateur n'est pas connecté
        if (loginBtn) {
            loginBtn.textContent = 'Connexion';

            // Supprimer le menu déroulant s'il existe
            const dropdownMenu = document.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.remove();
            }
        }

        // Afficher le bouton d'inscription si l'utilisateur n'est pas connecté
        if (registerBtn) {
            registerBtn.style.display = 'block';
        }
    }
}

// Connexion d'un utilisateur
function login(email, password) {
    // Rechercher l'utilisateur dans la "base de données"
    const user = users.find(u => u.email === email);

    if (!user) {
        showMessage('Aucun compte trouvé avec cet email.', 'error');
        return false;
    }

    // Dans un environnement réel, le mot de passe devrait être haché
    if (user.password !== password) {
        showMessage('Mot de passe incorrect.', 'error');
        return false;
    }

    // Stocker l'utilisateur connecté
    currentUser = {
        id: user.id,
        name: user.name,
        email: user.email
    };

    localStorage.setItem('appstore_current_user', JSON.stringify(currentUser));

    // Fermer le modal de connexion
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.style.display = 'none';
    }

    // Mettre à jour l'interface
    updateAuthUI();

    showMessage(`Bienvenue, ${user.name} !`, 'success');

    // Rediriger vers la page d'accueil si on est sur la page d'inscription
    if (window.location.pathname.includes('register.html')) {
        window.location.href = 'index.html';
    }

    return true;
}

// Inscription d'un utilisateur
function register(name, email, password, confirmPassword) {
    // Vérifier si les mots de passe correspondent
    if (password !== confirmPassword) {
        showMessage('Les mots de passe ne correspondent pas.', 'error');
        return false;
    }

    // Vérifier si l'email est déjà utilisé
    if (users.some(u => u.email === email)) {
        showMessage('Cet email est déjà utilisé.', 'error');
        return false;
    }

    // Créer un nouvel utilisateur
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        // Dans un environnement réel, le mot de passe devrait être haché
        password,
        createdAt: new Date().toISOString()
    };

    // Ajouter l'utilisateur à la "base de données"
    users.push(newUser);
    localStorage.setItem('appstore_users', JSON.stringify(users));

    // Connecter l'utilisateur
    login(email, password);

    showMessage('Compte créé avec succès !', 'success');

    return true;
}

// Déconnexion d'un utilisateur
function logout() {
    currentUser = null;
    localStorage.removeItem('appstore_current_user');

    // Mettre à jour l'interface
    updateAuthUI();

    showMessage('Vous avez été déconnecté.', 'info');

    return true;
}
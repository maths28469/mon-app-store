// auth-manager.js
// Ce fichier centralise la gestion de l'authentification et des mises à jour d'interface

// Variables globales
let currentUser = null;
let isUserAdmin = false;

// Initialiser l'authentification
document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier la session
    await checkAuthStatus();

    // Configurer les écouteurs d'événements
    setupAuthListeners();

    // Mettre à jour l'interface
    updateAuthUI();
});

// Vérifier si l'utilisateur est connecté
async function checkAuthStatus() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("Erreur de session:", error);
            return false;
        }

        if (data?.session) {
            // Récupérer les données utilisateur
            const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', data.session.user.id)
                .single();

            if (userError && userError.code !== 'PGRST116') {
                console.error("Erreur utilisateur:", userError);
            }

            // Définir l'utilisateur actuel
            currentUser = {
                id: data.session.user.id,
                email: data.session.user.email,
                name: userData?.name || 'Utilisateur',
                isAdmin: userData?.is_admin || false
            };
            isUserAdmin = userData?.is_admin || false;

            return true;
        }
    } catch (error) {
        console.error("Erreur de vérification d'authentification:", error);
    }

    currentUser = null;
    isUserAdmin = false;
    return false;
}

// Configurer les écouteurs d'événements
function setupAuthListeners() {
    // Modal de connexion
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginModal = document.getElementById('close-login-modal');
    const loginForm = document.getElementById('login-form');

    // Ouvrir le modal de connexion
    if (loginBtn && !currentUser) {
        loginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (loginModal) loginModal.classList.add('show');
        });
    }

    // Fermer le modal
    if (closeLoginModal && loginModal) {
        closeLoginModal.addEventListener('click', function () {
            loginModal.classList.remove('show');
        });

        // Fermer en cliquant à l'extérieur
        window.addEventListener('click', function (e) {
            if (e.target === loginModal) {
                loginModal.classList.remove('show');
            }
        });
    }

    // Traiter le formulaire de connexion
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            await login(email, password);
        });
    }

    // Gestion de la déconnexion (sera ajoutée dynamiquement)
}

// Mettre à jour l'interface utilisateur
function updateAuthUI() {
    const navContainer = document.getElementById('main-nav');

    if (!navContainer) return;

    if (currentUser) {
        // Version connectée
        navContainer.innerHTML = `
            <ul>
                <li><a href="index.html" class="${isActivePage('index.html')}">Accueil</a></li>
                <li><a href="categories.html" class="${isActivePage('categories.html')}">Catégories</a></li>
                <li class="user-menu">
                    <a href="#" id="user-menu-trigger">
                        <i class="fas fa-user-circle"></i>
                        ${currentUser.name}
                        <i class="fas fa-chevron-down"></i>
                    </a>
                    <div class="dropdown-menu">
                        <ul>
                            <li><a href="profile.html"><i class="fas fa-user"></i> Mon profil</a></li>
                            <li><a href="my-downloads.html"><i class="fas fa-download"></i> Mes téléchargements</a></li>
                            ${isUserAdmin ? `<li><a href="admin/index.html"><i class="fas fa-cog"></i> Administration</a></li>` : ''}
                            <li><a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Déconnexion</a></li>
                        </ul>
                    </div>
                </li>
            </ul>
        `;

        // Ajouter les comportements du menu déroulant
        const userMenuTrigger = document.getElementById('user-menu-trigger');
        if (userMenuTrigger) {
            userMenuTrigger.addEventListener('click', function (e) {
                e.preventDefault();
                this.parentNode.classList.toggle('active');
            });
        }

        // Ajouter le comportement de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async function (e) {
                e.preventDefault();
                await logout();
            });
        }
    } else {
        // Version non connectée
        navContainer.innerHTML = `
            <ul>
                <li><a href="index.html" class="${isActivePage('index.html')}">Accueil</a></li>
                <li><a href="categories.html" class="${isActivePage('categories.html')}">Catégories</a></li>
                <li><a href="#" id="nav-login-btn">Connexion</a></li>
                <li><a href="register.html" class="btn primary">Inscription</a></li>
            </ul>
        `;

        // Ajouter l'événement pour afficher le modal de connexion
        const navLoginBtn = document.getElementById('nav-login-btn');
        if (navLoginBtn) {
            navLoginBtn.addEventListener('click', function (e) {
                e.preventDefault();
                const loginModal = document.getElementById('login-modal');
                if (loginModal) loginModal.classList.add('show');
            });
        }
    }
}

// Fonction utilitaire pour marquer le lien actif
function isActivePage(page) {
    const currentPath = window.location.pathname;
    if (currentPath.endsWith(page) || (page === 'index.html' && currentPath.endsWith('/'))) {
        return 'active';
    }
    return '';
}

// Connexion
async function login(email, password) {
    try {
        // Afficher un indicateur de chargement
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
            }
        }

        // Connexion avec Supabase
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Récupérer les données utilisateur
        const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (userError && userError.code !== 'PGRST116') {
            console.error("Erreur données utilisateur:", userError);
        }

        // Mettre à jour l'utilisateur actuel
        currentUser = {
            id: data.user.id,
            email: data.user.email,
            name: userData?.name || 'Utilisateur',
            isAdmin: userData?.is_admin || false
        };
        isUserAdmin = userData?.is_admin || false;

        // Fermer le modal
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.classList.remove('show');

        // Afficher un message de succès
        showMessage('Connexion réussie !', 'success');

        // Mettre à jour l'interface
        updateAuthUI();

        return true;
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);

        // Afficher un message d'erreur
        showMessage(error.message || 'Identifiants incorrects.', 'error');

        return false;
    } finally {
        // Réactiver le bouton de soumission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Se connecter';
            }
        }
    }
}

// Déconnexion
async function logout() {
    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        // Réinitialiser l'utilisateur actuel
        currentUser = null;
        isUserAdmin = false;

        // Afficher un message de succès
        showMessage('Vous avez été déconnecté.', 'info');

        // Mettre à jour l'interface
        updateAuthUI();

        return true;
    } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);

        // Afficher un message d'erreur
        showMessage('Erreur lors de la déconnexion.', 'error');

        return false;
    }
}

// Afficher un message
function showMessage(message, type = 'info') {
    // Supprimer les messages existants
    const existingMessages = document.querySelectorAll('.message-toast');
    existingMessages.forEach(msg => msg.remove());

    // Créer un nouveau message
    const messageElement = document.createElement('div');
    messageElement.className = `message-toast ${type}`;
    messageElement.innerHTML = `
        <div class="message-content">
            <i class="${type === 'success' ? 'fas fa-check-circle' : type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="close-message">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Ajouter au document
    document.body.appendChild(messageElement);

    // Ajouter la classe d'affichage après un court délai (pour l'animation)
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 10);

    // Ajouter un événement pour fermer le message
    const closeBtn = messageElement.querySelector('.close-message');
    closeBtn.addEventListener('click', () => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            messageElement.remove();
        }, 300);
    });

    // Fermer automatiquement après 5 secondes
    setTimeout(() => {
        if (document.body.contains(messageElement)) {
            messageElement.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(messageElement)) {
                    messageElement.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Exposer les fonctions globalement
window.checkAuthStatus = checkAuthStatus;
window.updateAuthUI = updateAuthUI;
window.login = login;
window.logout = logout;
window.showMessage = showMessage;
window.currentUser = currentUser;
window.isUserAdmin = isUserAdmin;
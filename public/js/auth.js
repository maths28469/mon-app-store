// auth.js - Gestion de l'authentification avec Supabase

import supabase from './supabase-config.js';

// Variable pour stocker l'utilisateur courant
let currentUser = null;
let isUserAdmin = false;

// Vérifier si l'utilisateur est déjà connecté
async function checkCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (data?.session) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.session.user.id)
      .single();

    if (userData) {
      currentUser = {
        id: data.session.user.id,
        email: data.session.user.email,
        name: userData.name || 'Utilisateur',
        isAdmin: userData.is_admin || false
      };
      isUserAdmin = userData.is_admin || false;
    } else {
      currentUser = {
        id: data.session.user.id,
        email: data.session.user.email,
        name: 'Utilisateur',
        isAdmin: false
      };
    }

    updateAuthUI();
    return true;
  }

  return false;
}

// Initialiser les écouteurs d'événements pour les formulaires d'authentification
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier si l'utilisateur est connecté
  checkCurrentSession();

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
});

// Vérifier si l'utilisateur est connecté
function checkAuthStatus() {
  return currentUser !== null;
}

// Vérifier si l'utilisateur est administrateur
function isAdmin() {
  return isUserAdmin;
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

      // Supprimer le menu déroulant s'il existe déjà
      const existingDropdown = document.querySelector('.dropdown-menu');
      if (existingDropdown) {
        existingDropdown.remove();
      }

      // Ajouter un menu déroulant pour le profil et la déconnexion
      const dropdownMenu = document.createElement('div');
      dropdownMenu.className = 'dropdown-menu';

      let menuHTML = `
        <ul>
          <li><a href="#" id="profile-link">Mon Profil</a></li>
          <li><a href="#" id="logout-link">Déconnexion</a></li>
        </ul>
      `;

      // Ajouter le lien admin si l'utilisateur est admin
      if (isUserAdmin) {
        menuHTML = `
          <ul>
            <li><a href="admin/index.html" id="admin-link">Administration</a></li>
            <li><a href="#" id="profile-link">Mon Profil</a></li>
            <li><a href="#" id="logout-link">Déconnexion</a></li>
          </ul>
        `;
      }

      dropdownMenu.innerHTML = menuHTML;

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
async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Récupérer les données de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userData) {
      currentUser = {
        id: data.user.id,
        email: data.user.email,
        name: userData.name,
        isAdmin: userData.is_admin || false
      };
      isUserAdmin = userData.is_admin || false;
    } else {
      currentUser = {
        id: data.user.id,
        email: data.user.email,
        name: 'Utilisateur',
        isAdmin: false
      };
    }

    // Fermer le modal de connexion
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
      loginModal.style.display = 'none';
    }

    // Mettre à jour l'interface
    updateAuthUI();

    showMessage(`Connexion réussie !`, 'success');

    // Rediriger vers la page d'accueil si on est sur la page d'inscription
    if (window.location.pathname.includes('register.html')) {
      window.location.href = 'index.html';
    }

    return true;
  } catch (error) {
    console.error("Erreur de connexion:", error);
    showMessage('Identifiants incorrects.', 'error');
    return false;
  }
}

// Inscription d'un utilisateur
async function register(name, email, password, confirmPassword) {
  // Vérifier si les mots de passe correspondent
  if (password !== confirmPassword) {
    showMessage('Les mots de passe ne correspondent pas.', 'error');
    return false;
  }

  try {
    // Créer l'utilisateur
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    // Vérifier si c'est le premier utilisateur (pour en faire un admin)
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const isFirstUser = count === 0;

    // Ajouter l'utilisateur à la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          name,
          email,
          is_admin: isFirstUser,
          created_at: new Date().toISOString()
        }
      ]);

    if (userError) throw userError;

    // Connecter l'utilisateur
    await login(email, password);

    showMessage('Compte créé avec succès !', 'success');

    // Si c'est le premier utilisateur (admin), afficher un message spécial
    if (isFirstUser) {
      showMessage('Vous êtes le premier utilisateur, vous avez été désigné comme administrateur !', 'success');
    }

    // Rediriger vers la page d'accueil
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);

    return true;
  } catch (error) {
    console.error("Erreur d'inscription:", error);

    if (error.message.includes('email')) {
      showMessage('Cet email est déjà utilisé.', 'error');
    } else {
      showMessage('Erreur lors de l\'inscription.', 'error');
    }

    return false;
  }
}

// Déconnexion d'un utilisateur
async function logout() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    currentUser = null;
    isUserAdmin = false;

    // Mettre à jour l'interface
    updateAuthUI();

    showMessage('Vous avez été déconnecté.', 'info');

    // Rediriger vers la page d'accueil si on est dans la partie admin
    if (window.location.pathname.includes('/admin/')) {
      window.location.href = '../index.html';
    }

    return true;
  } catch (error) {
    console.error("Erreur de déconnexion:", error);
    showMessage('Erreur lors de la déconnexion.', 'error');
    return false;
  }
}

// Afficher des messages à l'utilisateur
function showMessage(message, type = 'info') {
  // Supprimer les messages existants
  const existingMessages = document.querySelectorAll('.message');
  existingMessages.forEach(msg => msg.remove());

  const messageContainer = document.createElement('div');
  messageContainer.className = `message ${type}`;
  messageContainer.textContent = message;

  document.body.appendChild(messageContainer);

  // Afficher le message pendant 3 secondes
  setTimeout(() => {
    messageContainer.remove();
  }, 3000);
}

// Exporter les fonctions
export {
  checkAuthStatus,
  isAdmin,
  login,
  register,
  logout,
  currentUser,
  showMessage
};
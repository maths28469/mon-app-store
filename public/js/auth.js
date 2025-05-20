// auth.js - Gestion de l'authentification avec Supabase

// Variables pour stocker l'utilisateur courant
let currentUser = null;
let isUserAdmin = false;

// Initialiser les écouteurs d'événements pour les formulaires d'authentification
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier si l'utilisateur est connecté
  checkAuthStatus();

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

// Vérifier si l'utilisateur est déjà connecté
async function checkAuthStatus() {
  try {
    // Récupérer la session actuelle
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Erreur de session:", error);
      return false;
    }

    if (data?.session) {
      // Récupérer les données utilisateur depuis notre table custom
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error("Erreur récupération utilisateur:", userError);
      }

      // Si l'utilisateur existe dans auth mais pas dans notre table
      if (!userData) {
        console.log("Utilisateur absent de la table users, tentative d'ajout...");

        // Vérifier si c'est le premier utilisateur (pour les droits admin)
        const { count, error: countError } = await supabaseClient
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (countError) console.error("Erreur comptage utilisateurs:", countError);

        const isFirstUser = (count === 0 || count === null);

        // Ajouter l'utilisateur manquant à notre table users
        const { error: insertError } = await supabaseClient
          .from('users')
          .insert([{
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.email.split('@')[0], // Nom par défaut basé sur l'email
            is_admin: isFirstUser,
            created_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error("Erreur d'insertion utilisateur:", insertError);
        } else {
          console.log("Utilisateur ajouté à la table users");
        }

        currentUser = {
          id: data.session.user.id,
          email: data.session.user.email,
          name: data.session.user.email.split('@')[0],
          isAdmin: isFirstUser
        };
        isUserAdmin = isFirstUser;
      } else {
        // Utilisateur trouvé dans notre table
        currentUser = {
          id: data.session.user.id,
          email: data.session.user.email,
          name: userData.name || 'Utilisateur',
          isAdmin: userData.is_admin || false
        };
        isUserAdmin = userData.is_admin || false;
      }

      updateAuthUI();
      return true;
    }
  } catch (error) {
    console.error("Erreur de vérification d'authentification:", error);
  }

  return false;
}

// Vérifier si l'utilisateur est connecté
function isLoggedIn() {
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

  if (isLoggedIn()) {
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
      loginBtn.href = '#';

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
    // Afficher un indicateur de chargement
    const loginButton = document.querySelector('#login-form button[type="submit"]');
    if (loginButton) {
      loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
      loginButton.disabled = true;
    }

    // Connexion avec Supabase
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    // Réinitialiser le bouton
    if (loginButton) {
      loginButton.innerHTML = 'Se connecter';
      loginButton.disabled = false;
    }

    if (error) throw error;

    // Récupérer les données de l'utilisateur
    const { data: userData, error: userError } = await supabaseClient
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
      // Si l'utilisateur n'existe pas dans notre table, l'ajouter
      await checkAuthStatus();
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

    let errorMessage = 'Identifiants incorrects.';
    if (error.message) {
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter.';
      } else {
        errorMessage = 'Erreur: ' + error.message;
      }
    }

    showMessage(errorMessage, 'error');

    // Réinitialiser le bouton si ce n'est pas déjà fait
    const loginButton = document.querySelector('#login-form button[type="submit"]');
    if (loginButton && loginButton.disabled) {
      loginButton.innerHTML = 'Se connecter';
      loginButton.disabled = false;
    }

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
    // Afficher un indicateur de chargement
    const registerButton = document.querySelector('#register-form button[type="submit"]');
    if (registerButton) {
      registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';
      registerButton.disabled = true;
    }

    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name: name }
      }
    });

    // Réinitialiser le bouton
    if (registerButton) {
      registerButton.innerHTML = "S'inscrire";
      registerButton.disabled = false;
    }

    if (authError) throw authError;

    console.log("Utilisateur créé dans Auth:", authData);

    // Vérifier si c'est le premier utilisateur (pour en faire un admin)
    const { count, error: countError } = await supabaseClient
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) console.error("Erreur count:", countError);

    const isFirstUser = (count === 0 || count === null);
    console.log("Est premier utilisateur:", isFirstUser, "count:", count);

    // Ajouter l'utilisateur à la table users
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .insert([
        {
          id: authData.user.id,
          name: name,
          email: email,
          is_admin: isFirstUser,
          created_at: new Date().toISOString()
        }
      ]);

    if (userError) {
      console.error("Erreur insertion:", userError);
      throw userError;
    }

    console.log("Utilisateur ajouté à la table users:", userData);

    // Connecter l'utilisateur automatiquement
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

    // Gestion des différents messages d'erreur
    let errorMessage = 'Erreur lors de l\'inscription';
    if (error.message) {
      if (error.message.includes('already registered')) {
        errorMessage = 'Cet email est déjà utilisé';
      } else if (error.message.includes('valid email')) {
        errorMessage = 'Veuillez entrer une adresse email valide';
      } else if (error.message.includes('password')) {
        errorMessage = 'Le mot de passe doit comporter au moins 6 caractères';
      } else {
        errorMessage += ': ' + error.message;
      }
    }

    showMessage(errorMessage, 'error');

    // Réinitialiser le bouton si ce n'est pas déjà fait
    const registerButton = document.querySelector('#register-form button[type="submit"]');
    if (registerButton && registerButton.disabled) {
      registerButton.innerHTML = "S'inscrire";
      registerButton.disabled = false;
    }

    return false;
  }
}

// Déconnexion d'un utilisateur
async function logout() {
  try {
    const { error } = await supabaseClient.auth.signOut();

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

// Générer les étoiles pour l'affichage de la note (fonction utilitaire)
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let stars = '';

  // Étoiles pleines
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }

  // Demi-étoile si nécessaire
  if (halfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }

  // Étoiles vides
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>';
  }

  return stars;
}

// Formater le nombre de téléchargements (fonction utilitaire)
function formatDownloads(downloads) {
  if (downloads >= 1000000) {
    return (downloads / 1000000).toFixed(1) + ' M';
  } else if (downloads >= 1000) {
    return (downloads / 1000).toFixed(1) + ' k';
  } else {
    return downloads.toString();
  }
}

// Formater la date (fonction utilitaire)
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('fr-FR', options);
}

// Exposer les fonctions globalement
window.checkAuthStatus = checkAuthStatus;
window.isLoggedIn = isLoggedIn;
window.isAdmin = isAdmin;
window.login = login;
window.register = register;
window.logout = logout;
window.showMessage = showMessage;
window.generateStars = generateStars;
window.formatDownloads = formatDownloads;
window.formatDate = formatDate;
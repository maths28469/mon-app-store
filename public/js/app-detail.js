// Configuration Supabase
const supabaseUrl = 'https://dbksdxqzbbsklzfntfiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRia3NkeHF6YmJza2x6Zm50ZmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzAzOTYsImV4cCI6MjA2MzI0NjM5Nn0.Cv-FBgmwCuzAqd6vThGoancA85C1X8o_GP59oPuxbZg';

// Vérifier que la bibliothèque Supabase est bien chargée
if (typeof supabase !== 'undefined') {
  window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
  console.log('Client Supabase initialisé avec succès');
} else {
  console.error('Erreur: La bibliothèque Supabase n\'est pas chargée correctement');
}

// Variables globales
let currentUser = null;
let isUserAdmin = false;

document.addEventListener('DOMContentLoaded', async () => {
  // Vérifier si l'utilisateur est connecté
  await checkAuthStatus();

  // Obtenir l'ID de l'application depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const appId = urlParams.get('id');

  if (!appId) {
    window.location.href = 'index.html';
    return;
  }

  // Afficher un loader pendant le chargement
  const appDetailContainer = document.getElementById('app-detail-container');
  if (appDetailContainer) {
    appDetailContainer.innerHTML = `
      <div class="loading-indicator">
        <i class="fas fa-spinner fa-spin"></i> Chargement de l'application...
      </div>
    `;
  }

  try {
    // Récupérer les informations de l'application
    const app = await getAppById(appId);

    if (!app) {
      if (appDetailContainer) {
        appDetailContainer.innerHTML = `
          <div class="error-container">
            <p>Application non trouvée.</p>
            <a href="index.html" class="btn primary">Retour à l'accueil</a>
          </div>
        `;
      }
      return;
    }

    // Mettre à jour le titre de la page
    document.title = `${app.name} - Mon App Store`;

    // Remplir la page avec les informations de l'application
    if (appDetailContainer) {
      // Générer les étoiles pour l'affichage de la note
      const starsHTML = generateStars(app.rating);

      // Générer les captures d'écran
      let screenshotsHTML = "";
      if (app.screenshots && Array.isArray(app.screenshots) && app.screenshots.length > 0) {
        screenshotsHTML = app.screenshots.map(screenshot =>
          `<img src="${screenshot}" alt="${app.name} screenshot">`
        ).join('');
      } else {
        screenshotsHTML = "<p>Aucune capture d'écran disponible</p>";
      }

      // Formater la date
      const releaseDate = new Date(app.release_date);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = releaseDate.toLocaleDateString('fr-FR', options);

      // Formater le nombre de téléchargements
      const downloads = app.downloads || 0;
      let formattedDownloads = downloads.toString();
      if (downloads >= 1000000) {
        formattedDownloads = (downloads / 1000000).toFixed(1) + ' M';
      } else if (downloads >= 1000) {
        formattedDownloads = (downloads / 1000).toFixed(1) + ' k';
      }

      appDetailContainer.innerHTML = `
        <div class="app-detail">
          <div class="app-detail-left">
            <img src="${app.icon}" alt="${app.name} icon" class="app-detail-icon">
            <div class="download-section">
              <a href="#" class="download-btn" id="download-btn">
                <i class="fas fa-download"></i>
                Télécharger
              </a>
              <p>Version ${app.version} | ${app.size}</p>
            </div>
          </div>
          <div class="app-detail-right">
            <h1 class="app-detail-name">${app.name}</h1>
            <div class="app-detail-developer">${app.developer}</div>
            <div class="app-detail-rating">
              <div class="stars">${starsHTML}</div>
              <div class="rating-value">${app.rating.toFixed(1)}</div>
            </div>
            <div class="app-detail-downloads">
              <i class="fas fa-download"></i> ${formattedDownloads} téléchargements
            </div>
            <div class="app-meta-info">
              <span><i class="fas fa-tag"></i> ${app.category}</span>
              <span><i class="fas fa-calendar-alt"></i> Mis à jour le ${formattedDate}</span>
            </div>
          </div>
        </div>
        
        <div class="app-screenshots">
          <h3>Captures d'écran</h3>
          <div class="screenshots-container">
            ${screenshotsHTML}
          </div>
        </div>
        
        <div class="app-description-full">
          <h3>Description</h3>
          <p>${app.full_description}</p>
        </div>
      `;

      // Ajouter l'événement de téléchargement
      const downloadBtn = document.getElementById('download-btn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          await downloadApp(appId);
        });
      }
    }
  } catch (error) {
    console.error("Erreur lors du chargement des détails de l'application:", error);
    if (appDetailContainer) {
      appDetailContainer.innerHTML = `
        <div class="error-container">
          <p>Une erreur est survenue lors du chargement de l'application.</p>
          <a href="index.html" class="btn primary">Retour à l'accueil</a>
        </div>
      `;
    }
  }

  // Mettre à jour l'interface utilisateur pour l'authentification
  updateAuthUI();
});

// Vérifier si l'utilisateur est déjà connecté
async function checkAuthStatus() {
  try {
    const { data, error } = await window.supabaseClient.auth.getSession();

    if (error) {
      console.error("Erreur de session:", error);
      return false;
    }

    if (data?.session) {
      // Récupérer les données utilisateur
      const { data: userData, error: userError } = await window.supabaseClient
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error("Erreur utilisateur:", userError);
      }

      // Stocker l'utilisateur actuel
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

  return false;
}

// Mettre à jour l'interface selon l'état de connexion
function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.querySelector('.register-btn');

  if (currentUser) {
    // L'utilisateur est connecté
    if (loginBtn) {
      loginBtn.textContent = currentUser.name;
      loginBtn.href = 'profile.html';

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
          <li><a href="profile.html" id="profile-link">Mon Profil</a></li>
          <li><a href="#" id="logout-link">Déconnexion</a></li>
        </ul>
      `;

      // Ajouter le lien admin si l'utilisateur est admin
      if (isUserAdmin) {
        menuHTML = `
          <ul>
            <li><a href="admin/index.html" id="admin-link">Administration</a></li>
            <li><a href="profile.html" id="profile-link">Mon Profil</a></li>
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
        logoutLink.addEventListener('click', async (e) => {
          e.preventDefault();
          await logout();
        });
      }

      // Afficher/cacher le menu au clic sur le nom d'utilisateur
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dropdownMenu.classList.toggle('show');
        return false;
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
      loginBtn.href = 'login.html';

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

// Obtenir une application par son ID
async function getAppById(id) {
  try {
    const { data, error } = await window.supabaseClient
      .from('apps')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data || null;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'application:", error);
    return null;
  }
}

// Télécharger une application
async function downloadApp(appId) {
  // Vérifier si l'utilisateur est connecté
  if (!currentUser) {
    // Rediriger vers la page de connexion
    showMessage('Vous devez être connecté pour télécharger des applications.', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return false;
  }

  try {
    const app = await getAppById(appId);

    if (!app) {
      showMessage('Application non trouvée.', 'error');
      return false;
    }

    // Désactiver le bouton de téléchargement pendant le processus
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Téléchargement...';
    }

    // Créer un lien de téléchargement
    const downloadLink = document.createElement('a');
    downloadLink.href = app.apk_file;
    downloadLink.download = app.name.replace(/\s+/g, '_').toLowerCase() + '.apk';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Incrémenter le compteur de téléchargements
    const { data, error } = await window.supabaseClient
      .from('apps')
      .update({ downloads: (app.downloads || 0) + 1 })
      .eq('id', appId);

    if (error) throw error;

    // Enregistrer le téléchargement dans la table downloads
    const { data: downloadData, error: downloadError } = await window.supabaseClient
      .from('downloads')
      .insert([
        {
          app_id: appId,
          user_id: currentUser.id,
          created_at: new Date().toISOString()
        }
      ]);

    if (downloadError) throw downloadError;

    showMessage(`Téléchargement de ${app.name} démarré !`, 'success');

    // Réactiver le bouton de téléchargement
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> Télécharger';
    }

    return true;
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    showMessage('Erreur lors du téléchargement.', 'error');

    // Réactiver le bouton de téléchargement en cas d'erreur
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> Télécharger';
    }

    return false;
  }
}

// Déconnexion d'un utilisateur
async function logout() {
  try {
    const { error } = await window.supabaseClient.auth.signOut();

    if (error) throw error;

    currentUser = null;
    isUserAdmin = false;

    // Mettre à jour l'interface
    updateAuthUI();

    showMessage('Vous avez été déconnecté.', 'info');

    // Rediriger vers la page d'accueil
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);

    return true;
  } catch (error) {
    console.error("Erreur de déconnexion:", error);
    showMessage('Erreur lors de la déconnexion.', 'error');
    return false;
  }
}

// Générer les étoiles pour l'affichage de la note
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
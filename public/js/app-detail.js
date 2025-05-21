// app-detail.js
// Utilisation de notre nouveau gestionnaire d'authentification

document.addEventListener('DOMContentLoaded', async () => {
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
      const starsHTML = generateStars(app.rating || 0);

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
      const releaseDate = new Date(app.release_date || app.created_at);
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
                            <div class="rating-value">${(app.rating || 0).toFixed(1)}</div>
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

          // Vérifier si l'utilisateur est connecté
          if (!currentUser) {
            showMessage('Vous devez être connecté pour télécharger des applications.', 'warning');

            // Ouvrir le modal de connexion
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
              loginModal.classList.add('show');
            } else {
              // Rediriger vers la page de connexion si pas de modal
              setTimeout(() => {
                window.location.href = 'login.html';
              }, 1000);
            }
            return;
          }

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
});

// Obtenir une application par son ID
async function getAppById(id) {
  try {
    const { data, error } = await supabaseClient
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
    const { data, error } = await supabaseClient
      .from('apps')
      .update({ downloads: (app.downloads || 0) + 1 })
      .eq('id', appId);

    if (error) throw error;

    // Enregistrer le téléchargement dans la table downloads
    const { data: downloadData, error: downloadError } = await supabaseClient
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
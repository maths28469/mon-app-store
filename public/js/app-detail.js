// app-detail.js - Gestion de la page de détail d'une application avec Supabase

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
});
// app-detail.js - Gestion de la page de détail d'une application

document.addEventListener('DOMContentLoaded', () => {
    // Obtenir l'ID de l'application depuis l'URL
    const appId = getUrlParameter('id');

    if (!appId) {
        window.location.href = 'index.html';
        return;
    }

    // Récupérer les informations de l'application
    const app = getAppById(appId);

    if (!app) {
        window.location.href = 'index.html';
        return;
    }

    // Remplir la page avec les informations de l'application
    const appDetailContainer = document.getElementById('app-detail-container');

    if (appDetailContainer) {
        // Générer les étoiles pour l'affichage de la note
        const starsHTML = generateStars(app.rating);

        // Générer les captures d'écran
        const screenshotsHTML = app.screenshots.map(screenshot =>
            `<img src="${screenshot}" alt="${app.name} screenshot">`
        ).join('');

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
                        <i class="fas fa-download"></i> ${formatDownloads(app.downloads)} téléchargements
                    </div>
                    <div class="app-meta-info">
                        <span><i class="fas fa-tag"></i> ${app.category}</span>
                        <span><i class="fas fa-calendar-alt"></i> Mis à jour le ${formatDate(app.releaseDate)}</span>
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
                <p>${app.fullDescription}</p>
            </div>
        `;

        // Ajouter l'événement de téléchargement
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                downloadApp(appId);
            });
        }
    }
});

// Formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}
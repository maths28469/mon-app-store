// app-detail.js - Gestion de la page de détail d'une application avec Supabase

import supabase from './supabase-config.js';
import { getAppById, downloadApp } from './apps.js';
import { generateStars, showMessage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Obtenir l'ID de l'application depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const appId = urlParams.get('id');

    if (!appId) {
        window.location.href = 'index.html';
        return;
    }

    // Récupérer les informations de l'application
    const app = await getAppById(appId);

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

        // Formater la date
        const releaseDate = new Date(app.release_date);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = releaseDate.toLocaleDateString('fr-FR', options);

        // Formater le nombre de téléchargements
        // app-detail.js (suite)
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
});

// Fonction pour obtenir un paramètre de l'URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}
// admin.js - Gestion de la partie administration avec Supabase

import supabase from '../js/supabase-config.js';
import { checkAuthStatus, isAdmin, showMessage } from '../js/auth.js';
import {
    loadApps,
    getAppById,
    addApp,
    updateApp,
    deleteApp,
    generateStars
} from '../js/apps.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier si l'utilisateur est connecté et est admin
    const isLoggedIn = await checkAuthStatus();

    if (!isLoggedIn || !isAdmin()) {
        // Rediriger vers la page de connexion
        window.location.href = '../index.html';
        showMessage('Vous n\'avez pas les droits pour accéder à l\'administration.', 'error');
        return;
    }

    // Traiter la page en fonction de l'URL actuelle
    const currentPath = window.location.pathname;

    if (currentPath.includes('index.html') || currentPath.endsWith('/admin/')) {
        // Page du tableau de bord
        await loadDashboard();
    } else if (currentPath.includes('add-app.html')) {
        // Page d'ajout d'application
        setupAddAppForm();
    } else if (currentPath.includes('edit-app.html')) {
        // Page d'édition d'application
        const appId = getUrlParameter('id');
        if (appId) {
            await setupEditAppForm(appId);
        } else {
            window.location.href = 'index.html';
        }
    }
});

// Charger le tableau de bord administrateur
async function loadDashboard() {
    // Mettre à jour les statistiques
    await updateStats();

    // Charger la liste des applications
    await loadAppsTable();
}

// Mettre à jour les statistiques du tableau de bord
async function updateStats() {
    const totalApps = document.getElementById('total-apps');
    const totalDownloads = document.getElementById('total-downloads');
    const totalUsers = document.getElementById('total-users');

    try {
        // Récupérer le nombre total d'applications
        const { data: apps, error: appsError } = await supabase
            .from('apps')
            .select('downloads');

        if (appsError) throw appsError;

        // Calculer le nombre total de téléchargements
        const totalDownloadsCount = apps.reduce((sum, app) => sum + (app.downloads || 0), 0);

        // Récupérer le nombre total d'utilisateurs
        const { count, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;

        // Mettre à jour les statistiques
        if (totalApps) totalApps.textContent = apps.length;

        if (totalDownloads) {
            let formattedDownloads = totalDownloadsCount.toString();
            if (totalDownloadsCount >= 1000000) {
                formattedDownloads = (totalDownloadsCount / 1000000).toFixed(1) + ' M';
            } else if (totalDownloadsCount >= 1000) {
                formattedDownloads = (totalDownloadsCount / 1000).toFixed(1) + ' k';
            }
            totalDownloads.textContent = formattedDownloads;
        }

        if (totalUsers) totalUsers.textContent = count;
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
        showMessage('Erreur lors de la récupération des statistiques.', 'error');
    }
}

// Charger la liste des applications dans le tableau
async function loadAppsTable() {
    const appsTableBody = document.getElementById('apps-table-body');

    if (!appsTableBody) return;

    try {
        // Charger les applications depuis Supabase
        const { data: apps, error } = await supabase
            .from('apps')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Vider le tableau
        appsTableBody.innerHTML = '';

        // Remplir le tableau avec les applications
        apps.forEach(app => {
            const row = document.createElement('tr');

            // Générer les étoiles pour l'affichage de la note
            const starsHTML = generateStars(app.rating);

            // Formater le nombre de téléchargements
            let formattedDownloads = (app.downloads || 0).toString();
            if (app.downloads >= 1000000) {
                formattedDownloads = (app.downloads / 1000000).toFixed(1) + ' M';
            } else if (app.downloads >= 1000) {
                formattedDownloads = (app.downloads / 1000).toFixed(1) + ' k';
            }

            row.innerHTML = `
                <td><img src="${app.icon}" alt="${app.name} icon" class="app-icon-small"></td>
                <td>${app.name}</td>
                <td>${app.category}</td>
                <td>${app.version}</td>
                <td>${formattedDownloads}</td>
                <td>
                    <div class="app-rating">
                        <div class="stars">${starsHTML}</div>
                        <div class="rating-value">${app.rating.toFixed(1)}</div>
                    </div>
                </td>
                <td>
                    <div class="app-actions">
                        <a href="edit-app.html?id=${app.id}" class="btn-edit" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </a>
                        <button class="btn-delete" title="Supprimer" data-id="${app.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;

            // Ajouter un événement pour le bouton de suppression
            const deleteBtn = row.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', async () => {
                if (confirm(`Êtes-vous sûr de vouloir supprimer l'application "${app.name}" ?`)) {
                    await handleDeleteApp(app.id);
                }
            });

            appsTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Erreur lors du chargement des applications:", error);
        showMessage('Erreur lors du chargement des applications.', 'error');
    }
}

// Gérer la suppression d'une application
async function handleDeleteApp(appId) {
    try {
        const success = await deleteApp(appId);

        if (success) {
            await loadAppsTable();
            await updateStats();
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de l'application:", error);
        showMessage('Erreur lors de la suppression de l\'application.', 'error');
    }
}

// Configurer le formulaire d'ajout d'application
function setupAddAppForm() {
    // Prévisualiser l'icône
    const appIcon = document.getElementById('app-icon');
    const iconPreview = document.getElementById('icon-preview');

    if (appIcon && iconPreview) {
        appIcon.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    iconPreview.innerHTML = `<img src="${e.target.result}" alt="Icône prévisualisée">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Prévisualiser la bannière
    const appBanner = document.getElementById('app-banner');
    const bannerPreview = document.getElementById('banner-preview');

    if (appBanner && bannerPreview) {
        appBanner.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    bannerPreview.innerHTML = `<img src="${e.target.result}" alt="Bannière prévisualisée">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Gérer les captures d'écran
    const addScreenshotBtn = document.getElementById('add-screenshot');
    const screenshotsInput = document.getElementById('screenshots-input');
    const screenshotsContainer = document.getElementById('screenshots-container');

    if (addScreenshotBtn && screenshotsInput && screenshotsContainer) {
        addScreenshotBtn.addEventListener('click', () => {
            screenshotsInput.click();
        });

        screenshotsInput.addEventListener('change', (e) => {
            const files = e.target.files;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();

                reader.onload = (e) => {
                    const screenshotDiv = document.createElement('div');
                    screenshotDiv.className = 'screenshot-preview';
                    screenshotDiv.innerHTML = `
                        <img src="${e.target.result}" alt="Capture d'écran">
                        <div class="remove-btn">
                            <i class="fas fa-times"></i>
                        </div>
                    `;

                    // Ajouter l'événement pour supprimer la capture d'écran
                    const removeBtn = screenshotDiv.querySelector('.remove-btn');
                    removeBtn.addEventListener('click', () => {
                        screenshotDiv.remove();
                    });

                    // Insérer avant le bouton d'ajout
                    screenshotsContainer.insertBefore(screenshotDiv, addScreenshotBtn);
                };

                reader.readAsDataURL(file);
            }
        });
    }

    // Bouton d'annulation
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Traitement du formulaire
    const addAppForm = document.getElementById('add-app-form');
    if (addAppForm) {
        addAppForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Récupérer les valeurs du formulaire
            const formData = {
                name: document.getElementById('app-name').value,
                developer: document.getElementById('app-developer').value,
                category: document.getElementById('app-category').value,
                version: document.getElementById('app-version').value,
                size: document.getElementById('app-size').value,
                featured: document.getElementById('app-featured').value,
                shortDescription: document.getElementById('app-short-description').value,
                fullDescription: document.getElementById('app-full-description').value
            };

            // Récupérer les fichiers
            const iconFile = document.getElementById('app-icon').files[0];
            const bannerFile = document.getElementById('app-banner').files[0];

            // Récupérer les captures d'écran
            const screenshotPreviews = document.querySelectorAll('.screenshot-preview img');
            const screenshotFiles = [];

            screenshotPreviews.forEach(img => {
                const src = img.src;
                if (src.startsWith('data:')) {
                    // Convertir le data URL en Blob
                    const arr = src.split(',');
                    const mime = arr[0].match(/:(.*?);/)[1];
                    const bstr = atob(arr[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);

                    while (n--) {
                        u8arr[n] = bstr.charCodeAt(n);
                    }

                    const blob = new Blob([u8arr], { type: mime });
                    const file = new File([blob], `screenshot_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    screenshotFiles.push(file);
                }
            });

            // Récupérer le fichier APK
            const apkFile = document.getElementById('app-apk').files[0];

            // Validation des champs requis
            if (!formData.name || !formData.developer || !formData.category || !formData.version ||
                !formData.size || !formData.shortDescription || !formData.fullDescription ||
                !iconFile || !bannerFile || screenshotFiles.length === 0 || !apkFile) {

                showMessage('Veuillez remplir tous les champs requis et ajouter tous les fichiers nécessaires.', 'error');
                return;
            }

            // Ajouter l'application
            const loading = document.createElement('div');
            loading.className = 'loading';
            loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ajout de l\'application en cours...';
            document.body.appendChild(loading);

            try {
                const success = await addApp(formData, iconFile, bannerFile, screenshotFiles, apkFile);

                loading.remove();

                if (success) {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                }
            } catch (error) {
                loading.remove();
                console.error("Erreur lors de l'ajout de l'application:", error);
                showMessage('Erreur lors de l\'ajout de l\'application.', 'error');
            }
        });
    }
}

// Configurer le formulaire d'édition d'application
async function setupEditAppForm(appId) {
    try {
        // Récupérer l'application depuis Supabase
        const app = await getAppById(appId);

        if (!app) {
            showMessage('Application non trouvée.', 'error');
            window.location.href = 'index.html';
            return;
        }

        // Remplir le formulaire avec les données de l'application
        document.getElementById('app-name').value = app.name;
        document.getElementById('app-developer').value = app.developer;
        document.getElementById('app-category').value = app.category;
        document.getElementById('app-version').value = app.version;
        document.getElementById('app-size').value = app.size;
        document.getElementById('app-featured').value = app.featured ? 'true' : 'false';
        document.getElementById('app-short-description').value = app.short_description;
        document.getElementById('app-full-description').value = app.full_description;

        // Afficher l'icône
        const iconPreview = document.getElementById('icon-preview');
        if (iconPreview) {
            iconPreview.innerHTML = `<img src="${app.icon}" alt="Icône">`;
        }

        // Afficher la bannière
        const bannerPreview = document.getElementById('banner-preview');
        if (bannerPreview) {
            bannerPreview.innerHTML = `<img src="${app.banner}" alt="Bannière">`;
        }

        // Afficher les captures d'écran
        const screenshotsContainer = document.getElementById('screenshots-container');
        const addScreenshotBtn = document.getElementById('add-screenshot');

        if (screenshotsContainer && addScreenshotBtn && app.screenshots) {
            app.screenshots.forEach(screenshot => {
                const screenshotDiv = document.createElement('div');
                screenshotDiv.className = 'screenshot-preview';
                screenshotDiv.innerHTML = `
                    <img src="${screenshot}" alt="Capture d'écran">
                    <div class="remove-btn">
                        <i class="fas fa-times"></i>
                    </div>
                `;

                // Ajouter l'événement pour supprimer la capture d'écran
                const removeBtn = screenshotDiv.querySelector('.remove-btn');
                removeBtn.addEventListener('click', () => {
                    screenshotDiv.remove();
                });

                // Insérer avant le bouton d'ajout
                screenshotsContainer.insertBefore(screenshotDiv, addScreenshotBtn);
            });
        }

        // Configurer les événements du formulaire comme dans setupAddAppForm
        setupAddAppForm();

        // Modifier le formulaire pour la mise à jour
        const form = document.getElementById('add-app-form');
        if (form) {
            form.id = 'edit-app-form';
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = "Mettre à jour l'application";
            }

            // Remplacer l'événement submit
            form.removeEventListener('submit', form.onsubmit);
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Récupérer les valeurs du formulaire
                const formData = {
                    name: document.getElementById('app-name').value,
                    developer: document.getElementById('app-developer').value,
                    category: document.getElementById('app-category').value,
                    version: document.getElementById('app-version').value,
                    size: document.getElementById('app-size').value,
                    featured: document.getElementById('app-featured').value,
                    shortDescription: document.getElementById('app-short-description').value,
                    fullDescription: document.getElementById('app-full-description').value
                };

                // Récupérer les fichiers (optionnels pour l'édition)
                const iconFile = document.getElementById('app-icon').files[0] || null;
                const bannerFile = document.getElementById('app-banner').files[0] || null;
                const apkFile = document.getElementById('app-apk').files[0] || null;

                // Récupérer les captures d'écran
                const screenshotPreviews = document.querySelectorAll('.screenshot-preview img');
                const screenshotFiles = [];

                // Détecter les nouvelles captures d'écran (data URLs)
                screenshotPreviews.forEach(img => {
                    const src = img.src;
                    if (src.startsWith('data:')) {
                        // Convertir le data URL en Blob
                        const arr = src.split(',');
                        const mime = arr[0].match(/:(.*?);/)[1];
                        const bstr = atob(arr[1]);
                        let n = bstr.length;
                        const u8arr = new Uint8Array(n);

                        while (n--) {
                            u8arr[n] = bstr.charCodeAt(n);
                        }

                        const blob = new Blob([u8arr], { type: mime });
                        const file = new File([blob], `screenshot_${Date.now()}.jpg`, { type: 'image/jpeg' });
                        screenshotFiles.push(file);
                    }
                });

                // Validation des champs requis
                if (!formData.name || !formData.developer || !formData.category || !formData.version ||
                    !formData.size || !formData.shortDescription || !formData.fullDescription) {

                    showMessage('Veuillez remplir tous les champs requis.', 'error');
                    return;
                }

                // Mettre à jour l'application
                const loading = document.createElement('div');
                loading.className = 'loading';
                loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mise à jour de l\'application en cours...';
                document.body.appendChild(loading);

                try {
                    const success = await updateApp(
                        appId,
                        formData,
                        iconFile,
                        bannerFile,
                        screenshotFiles.length > 0 ? screenshotFiles : null,
                        apkFile
                    );

                    loading.remove();

                    if (success) {
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1500);
                    }
                } catch (error) {
                    loading.remove();
                    console.error("Erreur lors de la mise à jour de l'application:", error);
                    showMessage('Erreur lors de la mise à jour de l\'application.', 'error');
                }
            });
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'application:", error);
        showMessage('Erreur lors du chargement de l\'application.', 'error');
        window.location.href = 'index.html';
    }
}

// Fonction pour obtenir un paramètre de l'URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}
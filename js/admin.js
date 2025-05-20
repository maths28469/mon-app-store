// admin.js - Gestion de la partie administration

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si l'utilisateur est connecté (et est admin)
    if (!checkAuthStatus()) {
        // Rediriger vers la page de connexion
        window.location.href = '../index.html';
        return;
    }

    // Mettre à jour le nom de l'admin dans la barre de navigation
    const adminName = document.getElementById('admin-name');
    if (adminName && currentUser) {
        adminName.textContent = currentUser.name;
    }

    // Traiter la page en fonction de l'URL actuelle
    const currentPath = window.location.pathname;

    if (currentPath.includes('index.html') || currentPath.endsWith('/admin/')) {
        // Page du tableau de bord
        loadDashboard();
    } else if (currentPath.includes('add-app.html')) {
        // Page d'ajout d'application
        setupAddAppForm();
    } else if (currentPath.includes('edit-app.html')) {
        // Page d'édition d'application
        const appId = getUrlParameter('id');
        if (appId) {
            setupEditAppForm(appId);
        } else {
            window.location.href = 'index.html';
        }
    }
});

// Charger le tableau de bord administrateur
function loadDashboard() {
    // Mettre à jour les statistiques
    updateStats();

    // Charger la liste des applications
    loadAppsTable();
}

// Mettre à jour les statistiques du tableau de bord
function updateStats() {
    const totalApps = document.getElementById('total-apps');
    const totalDownloads = document.getElementById('total-downloads');
    const totalUsers = document.getElementById('total-users');

    if (totalApps) {
        totalApps.textContent = appsData.length;
    }

    if (totalDownloads) {
        const downloads = appsData.reduce((total, app) => total + app.downloads, 0);
        totalDownloads.textContent = formatDownloads(downloads);
    }

    if (totalUsers) {
        // Récupérer le nombre d'utilisateurs depuis le localStorage
        const users = JSON.parse(localStorage.getItem('appstore_users')) || [];
        totalUsers.textContent = users.length;
    }
}

// Charger la liste des applications dans le tableau
function loadAppsTable() {
    const appsTableBody = document.getElementById('apps-table-body');

    if (!appsTableBody) return;

    // Vider le tableau
    appsTableBody.innerHTML = '';

    // Remplir le tableau avec les applications
    appsData.forEach(app => {
        const row = document.createElement('tr');

        // Générer les étoiles pour l'affichage de la note
        const starsHTML = generateStars(app.rating);

        row.innerHTML = `
            <td><img src="../${app.icon}" alt="${app.name} icon" class="app-icon-small"></td>
            <td>${app.name}</td>
            <td>${app.category}</td>
            <td>${app.version}</td>
            <td>${formatDownloads(app.downloads)}</td>
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
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Êtes-vous sûr de vouloir supprimer l'application "${app.name}" ?`)) {
                deleteApp(app.id);
            }
        });

        appsTableBody.appendChild(row);
    });
}

// Supprimer une application
function deleteApp(appId) {
    // Dans un environnement réel, vous feriez une requête API pour supprimer l'application
    // Ici, nous simulons la suppression en modifiant le tableau de données

    const appIndex = appsData.findIndex(app => app.id === appId);

    if (appIndex !== -1) {
        appsData.splice(appIndex, 1);

        // Mettre à jour le tableau et les statistiques
        loadAppsTable();
        updateStats();

        showMessage('Application supprimée avec succès.', 'success');
    } else {
        showMessage('Application non trouvée.', 'error');
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
        addAppForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Récupérer les valeurs du formulaire
            const formData = new FormData(addAppForm);

            // Validation des champs requis
            const requiredFields = ['name', 'developer', 'version', 'size', 'category', 'shortDescription', 'fullDescription'];
            let isValid = true;

            requiredFields.forEach(field => {
                if (!formData.get(field)) {
                    isValid = false;
                }
            });

            // Vérifier si les fichiers requis sont fournis
            if (!appIcon.files[0] || !appBanner.files[0] || !document.getElementById('app-apk').files[0]) {
                isValid = false;
            }

            // Vérifier s'il y a au moins une capture d'écran
            const screenshotPreviews = document.querySelectorAll('.screenshot-preview');
            if (screenshotPreviews.length === 0) {
                isValid = false;
            }

            if (!isValid) {
                showMessage('Veuillez remplir tous les champs requis.', 'error');
                return;
            }

            // Traiter les données du formulaire (simulé)
            saveApp(formData);
        });
    }
}

// Configurer le formulaire d'édition d'application
function setupEditAppForm(appId) {
    // Similaire à la fonction setupAddAppForm, mais avec les valeurs pré-remplies
    // Cette fonction serait implémentée de manière similaire à setupAddAppForm
    console.log('Édition de l\'application ' + appId);
}

// Sauvegarder une application (Ajout/Édition)
function saveApp(formData) {
    // Dans un environnement réel, vous enverriez ces données à votre API
    // Ici, nous simulons l'ajout d'une nouvelle application

    // Générer un ID unique
    const newId = 'app' + (appsData.length + 1);

    // Créer un nouvel objet application
    const newApp = {
        id: newId,
        name: formData.get('name'),
        developer: formData.get('developer'),
        shortDescription: formData.get('shortDescription'),
        fullDescription: formData.get('fullDescription'),
        icon: 'assets/apps/' + newId + '/icon.png', // Chemin simulé
        banner: 'assets/apps/' + newId + '/banner.jpg', // Chemin simulé
        screenshots: [
            'assets/apps/' + newId + '/screenshots/screen1.jpg',
            'assets/apps/' + newId + '/screenshots/screen2.jpg',
        ],
        category: formData.get('category'),
        rating: 0, // Nouvelle application, pas encore de note
        downloads: 0, // Nouvelle application, pas encore de téléchargements
        version: formData.get('version'),
        size: formData.get('size'),
        releaseDate: new Date().toISOString().split('T')[0],
        apkFile: 'assets/apps/' + newId + '/' + formData.get('name').toLowerCase().replace(/\s+/g, '_') + '.apk',
        featured: formData.get('featured') === 'true'
    };

    // Ajouter la nouvelle application aux données
    appsData.push(newApp);

    // Afficher un message de succès
    showMessage('Application ajoutée avec succès.', 'success');

    // Rediriger vers le tableau de bord
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}
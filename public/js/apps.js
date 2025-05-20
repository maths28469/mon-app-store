// apps.js - Gestion des applications avec Supabase

// Variable pour stocker les applications
let appsData = [];

// Charger les applications depuis Supabase
async function loadApps() {
  try {
    const { data, error } = await supabaseClient
      .from('apps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    appsData = data || [];
    return appsData;
  } catch (error) {
    console.error("Erreur lors du chargement des applications:", error);
    showMessage("Impossible de charger les applications", "error");
    return [];
  }
}

// Afficher les applications sur la page d'accueil
document.addEventListener('DOMContentLoaded', async () => {
  // Vérifier si nous sommes sur la page d'accueil
  const featuredAppsContainer = document.getElementById('featured-apps-container');
  const allAppsContainer = document.getElementById('all-apps-container');

  if (featuredAppsContainer && allAppsContainer) {
    // Afficher un indicateur de chargement
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement des applications...';
    allAppsContainer.parentNode.insertBefore(loadingIndicator, allAppsContainer);

    try {
      // Charger les applications depuis Supabase
      await loadApps();

      // Supprimer l'indicateur de chargement
      loadingIndicator.remove();

      // Vérifier si des applications ont été trouvées
      if (appsData.length === 0) {
        const noAppsMessage = document.createElement('p');
        noAppsMessage.className = 'no-apps-message';
        noAppsMessage.textContent = "Aucune application disponible pour le moment.";
        allAppsContainer.appendChild(noAppsMessage);
        return;
      }

      // Afficher les applications vedettes
      const featuredApps = appsData.filter(app => app.featured);

      if (featuredApps.length > 0) {
        featuredApps.forEach(app => {
          const appCard = createAppCard(app);
          featuredAppsContainer.appendChild(appCard);
        });
      } else {
        featuredAppsContainer.innerHTML = '<p>Aucune application vedette pour le moment.</p>';
      }

      // Afficher toutes les applications
      appsData.forEach(app => {
        const appCard = createAppCard(app);
        allAppsContainer.appendChild(appCard);
      });
    } catch (error) {
      console.error("Erreur lors de l'affichage des applications:", error);
      loadingIndicator.innerHTML = '<p>Erreur lors du chargement des applications. Veuillez réessayer.</p>';
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
  // Vérifier si l'utilisateur est connecté
  if (!isLoggedIn()) {
    // Afficher le modal de connexion
    document.getElementById('login-modal').style.display = 'flex';
    return false;
  }

  try {
    const app = await getAppById(appId);

    if (!app) {
      showMessage('Application non trouvée.', 'error');
      return false;
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
    return true;
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    showMessage('Erreur lors du téléchargement.', 'error');
    return false;
  }
}

// Ajouter une nouvelle application
async function addApp(appData, iconFile, bannerFile, screenshotFiles, apkFile) {
  try {
    // Vérifier si l'utilisateur est admin
    if (!isAdmin()) {
      showMessage('Vous n\'avez pas les droits pour ajouter une application.', 'error');
      return false;
    }

    // Génération d'un ID unique pour l'application
    const appId = 'app_' + Date.now();

    // Upload de l'icône
    const iconPath = `apps/${appId}/icon.${iconFile.name.split('.').pop()}`;
    const { error: iconError } = await supabaseClient.storage
      .from('appstore')
      .upload(iconPath, iconFile);

    if (iconError) throw iconError;

    // Obtenir l'URL de l'icône
    const { data: iconUrl } = supabaseClient.storage
      .from('appstore')
      .getPublicUrl(iconPath);

    // Upload de la bannière
    const bannerPath = `apps/${appId}/banner.${bannerFile.name.split('.').pop()}`;
    const { error: bannerError } = await supabaseClient.storage
      .from('appstore')
      .upload(bannerPath, bannerFile);

    if (bannerError) throw bannerError;

    // Obtenir l'URL de la bannière
    const { data: bannerUrl } = supabaseClient.storage
      .from('appstore')
      .getPublicUrl(bannerPath);

    // Upload des captures d'écran
    const screenshotUrls = [];
    for (let i = 0; i < screenshotFiles.length; i++) {
      const file = screenshotFiles[i];
      const screenshotPath = `apps/${appId}/screenshots/screen_${i}.${file.name.split('.').pop()}`;
      const { error: screenshotError } = await supabaseClient.storage
        .from('appstore')
        .upload(screenshotPath, file);

      if (screenshotError) throw screenshotError;

      // Obtenir l'URL de la capture d'écran
      const { data: screenshotUrl } = supabaseClient.storage
        .from('appstore')
        .getPublicUrl(screenshotPath);

      screenshotUrls.push(screenshotUrl.publicUrl);
    }

    // Upload du fichier APK
    const apkPath = `apps/${appId}/apk/${appData.name.replace(/\s+/g, '_').toLowerCase()}.apk`;
    const { error: apkError } = await supabaseClient.storage
      .from('appstore')
      .upload(apkPath, apkFile);

    if (apkError) throw apkError;

    // Obtenir l'URL de l'APK
    const { data: apkUrl } = supabaseClient.storage
      .from('appstore')
      .getPublicUrl(apkPath);

    // Créer l'objet application
    const newApp = {
      id: appId,
      name: appData.name,
      developer: appData.developer,
      short_description: appData.shortDescription,
      full_description: appData.fullDescription,
      icon: iconUrl.publicUrl,
      banner: bannerUrl.publicUrl,
      screenshots: screenshotUrls,
      category: appData.category,
      rating: 0,
      downloads: 0,
      version: appData.version,
      size: appData.size,
      release_date: new Date().toISOString(),
      apk_file: apkUrl.publicUrl,
      featured: appData.featured === 'true',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Ajouter l'application à la base de données
    const { data, error } = await supabaseClient
      .from('apps')
      .insert([newApp]);

    if (error) throw error;

    showMessage('Application ajoutée avec succès !', 'success');
    return appId;
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'application:", error);
    showMessage('Erreur lors de l\'ajout de l\'application.', 'error');
    return false;
  }
}

// Mettre à jour une application existante
async function updateApp(appId, appData, iconFile, bannerFile, screenshotFiles, apkFile) {
  try {
    // Vérifier si l'utilisateur est admin
    if (!isAdmin()) {
      showMessage('Vous n\'avez pas les droits pour modifier une application.', 'error');
      return false;
    }

    // Récupérer l'application existante
    const app = await getAppById(appId);
    if (!app) {
      showMessage('Application non trouvée.', 'error');
      return false;
    }

    // Préparer l'objet de mise à jour
    const updateData = {
      name: appData.name,
      developer: appData.developer,
      short_description: appData.shortDescription,
      full_description: appData.fullDescription,
      category: appData.category,
      version: appData.version,
      size: appData.size,
      featured: appData.featured === 'true',
      updated_at: new Date().toISOString()
    };

    // Upload des nouveaux fichiers si fournis
    if (iconFile) {
      const iconPath = `apps/${appId}/icon.${iconFile.name.split('.').pop()}`;
      const { error: iconError } = await supabaseClient.storage
        .from('appstore')
        .upload(iconPath, iconFile, { upsert: true });

      if (iconError) throw iconError;

      // Obtenir l'URL de l'icône
      const { data: iconUrl } = supabaseClient.storage
        .from('appstore')
        .getPublicUrl(iconPath);

      updateData.icon = iconUrl.publicUrl;
    }

    if (bannerFile) {
      const bannerPath = `apps/${appId}/banner.${bannerFile.name.split('.').pop()}`;
      const { error: bannerError } = await supabaseClient.storage
        .from('appstore')
        .upload(bannerPath, bannerFile, { upsert: true });

      if (bannerError) throw bannerError;

      // Obtenir l'URL de la bannière
      const { data: bannerUrl } = supabaseClient.storage
        .from('appstore')
        .getPublicUrl(bannerPath);

      updateData.banner = bannerUrl.publicUrl;
    }

    if (screenshotFiles && screenshotFiles.length > 0) {
      const screenshotUrls = [];
      for (let i = 0; i < screenshotFiles.length; i++) {
        const file = screenshotFiles[i];
        const screenshotPath = `apps/${appId}/screenshots/screen_new_${i}.${file.name.split('.').pop()}`;
        const { error: screenshotError } = await supabaseClient.storage
          .from('appstore')
          .upload(screenshotPath, file);

        if (screenshotError) throw screenshotError;

        // Obtenir l'URL de la capture d'écran
        const { data: screenshotUrl } = supabaseClient.storage
          .from('appstore')
          .getPublicUrl(screenshotPath);

        screenshotUrls.push(screenshotUrl.publicUrl);
      }

      updateData.screenshots = screenshotUrls;
    }

    if (apkFile) {
      const apkPath = `apps/${appId}/apk/${appData.name.replace(/\s+/g, '_').toLowerCase()}_v${appData.version}.apk`;
      const { error: apkError } = await supabaseClient.storage
        .from('appstore')
        .upload(apkPath, apkFile);

      if (apkError) throw apkError;

      // Obtenir l'URL de l'APK
      const { data: apkUrl } = supabaseClient.storage
        .from('appstore')
        .getPublicUrl(apkPath);

      updateData.apk_file = apkUrl.publicUrl;
    }

    // Mettre à jour l'application dans la base de données
    const { data, error } = await supabaseClient
      .from('apps')
      .update(updateData)
      .eq('id', appId);

    if (error) throw error;

    showMessage('Application mise à jour avec succès !', 'success');
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'application:", error);
    showMessage('Erreur lors de la mise à jour de l\'application.', 'error');
    return false;
  }
}

// Supprimer une application
async function deleteApp(appId) {
  try {
    // Vérifier si l'utilisateur est admin
    if (!isAdmin()) {
      showMessage('Vous n\'avez pas les droits pour supprimer une application.', 'error');
      return false;
    }

    // Supprimer l'application de la base de données
    const { data, error } = await supabaseClient
      .from('apps')
      .delete()
      .eq('id', appId);

    if (error) throw error;

    // Note: Les fichiers dans Storage ne sont pas supprimés automatiquement
    // Dans une application réelle, vous devriez également supprimer les fichiers associés

    showMessage('Application supprimée avec succès.', 'success');
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de l'application:", error);
    showMessage('Erreur lors de la suppression de l\'application.', 'error');
    return false;
  }
}

// Fonction utilitaire pour créer une carte d'application
function createAppCard(app) {
  const card = document.createElement('div');
  card.className = 'app-card';

  // Création des étoiles pour l'affichage de la note
  const starsHTML = generateStars(app.rating);

  card.innerHTML = `
        <img src="${app.banner}" alt="${app.name}">
        <img src="${app.icon}" alt="${app.name} icon" class="app-icon">
        <div class="app-info">
            <h4>${app.name}</h4>
            <div class="app-developer">${app.developer}</div>
            <div class="app-description">${app.short_description}</div>
            <div class="app-meta">
                <div class="app-rating">
                    <div class="stars">${starsHTML}</div>
                    <div class="rating-value">${app.rating.toFixed(1)}</div>
                </div>
                <a href="app-details.html?id=${app.id}" class="btn secondary">Voir</a>
            </div>
        </div>
    `;

  return card;
}

// Exposer les fonctions globalement
window.loadApps = loadApps;
window.getAppById = getAppById;
window.downloadApp = downloadApp;
window.addApp = addApp;
window.updateApp = updateApp;
window.deleteApp = deleteApp;
window.appsData = appsData;
window.createAppCard = createAppCard;
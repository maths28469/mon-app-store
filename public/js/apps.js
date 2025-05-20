// apps.js - Gestion des applications avec Supabase

import supabase from './supabase-config.js';
import { checkAuthStatus, isAdmin, showMessage } from './auth.js';

// Variable pour stocker les applications
let appsData = [];

// Charger les applications depuis Supabase
async function loadApps() {
  try {
    const { data, error } = await supabase
      .from('apps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    appsData = data || [];
    return appsData;
  } catch (error) {
    console.error("Erreur lors du chargement des applications:", error);
    return [];
  }
}

// Afficher les applications sur la page d'accueil
document.addEventListener('DOMContentLoaded', async () => {
  // Vérifier si nous sommes sur la page d'accueil
  const featuredAppsContainer = document.getElementById('featured-apps-container');
  const allAppsContainer = document.getElementById('all-apps-container');

  if (featuredAppsContainer && allAppsContainer) {
    // Charger les applications depuis Supabase
    await loadApps();

    // Afficher les applications vedettes
    const featuredApps = appsData.filter(app => app.featured);
    featuredApps.forEach(app => {
      const appCard = createAppCard(app);
      featuredAppsContainer.appendChild(appCard);
    });

    // Afficher toutes les applications
    appsData.forEach(app => {
      const appCard = createAppCard(app);
      allAppsContainer.appendChild(appCard);
    });
  }
});

// Obtenir une application par son ID
async function getAppById(id) {
  try {
    const { data, error } = await supabase
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
  if (!checkAuthStatus()) {
    // Afficher le modal de connexion
    document.getElementById('login-modal').style.display = 'flex';
    return false;
  }

  try {
    const app = await getAppById(appId);

    if (app) {
      // Créer un lien de téléchargement
      const downloadLink = document.createElement('a');
      downloadLink.href = app.apk_file;
      downloadLink.download = app.name.replace(/\s+/g, '_').toLowerCase() + '.apk';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Incrémenter le compteur de téléchargements
      const { data, error } = await supabase
        .from('apps')
        .update({ downloads: (app.downloads || 0) + 1 })
        .eq('id', appId);

      if (error) throw error;

      // Enregistrer le téléchargement dans la table downloads
      const { data: downloadData, error: downloadError } = await supabase
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
    }

    showMessage('Application non trouvée.', 'error');
    return false;
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

    // Upload de l'icône
    const iconPath = `apps/icons/${Date.now()}_${iconFile.name}`;
    const { data: iconData, error: iconError } = await supabase.storage
      .from('appstore')
      .upload(iconPath, iconFile);

    if (iconError) throw iconError;

    // Obtenir l'URL de l'icône
    const { data: iconUrl } = supabase.storage
      .from('appstore')
      .getPublicUrl(iconPath);

    // Upload de la bannière
    const bannerPath = `apps/banners/${Date.now()}_${bannerFile.name}`;
    const { data: bannerData, error: bannerError } = await supabase.storage
      .from('appstore')
      .upload(bannerPath, bannerFile);

    if (bannerError) throw bannerError;

    // Obtenir l'URL de la bannière
    const { data: bannerUrl } = supabase.storage
      .from('appstore')
      .getPublicUrl(bannerPath);

    // Upload des captures d'écran
    const screenshotUrls = [];
    for (const file of screenshotFiles) {
      const screenshotPath = `apps/screenshots/${Date.now()}_${file.name}`;
      const { data: screenshotData, error: screenshotError } = await supabase.storage
        .from('appstore')
        .upload(screenshotPath, file);

      if (screenshotError) throw screenshotError;

      // Obtenir l'URL de la capture d'écran
      const { data: screenshotUrl } = supabase.storage
        .from('appstore')
        .getPublicUrl(screenshotPath);

      screenshotUrls.push(screenshotUrl.publicUrl);
    }

    // Upload du fichier APK
    const apkPath = `apps/apk/${Date.now()}_${apkFile.name}`;
    const { data: apkData, error: apkError } = await supabase.storage
      .from('appstore')
      .upload(apkPath, apkFile);

    if (apkError) throw apkError;

    // Obtenir l'URL de l'APK
    const { data: apkUrl } = supabase.storage
      .from('appstore')
      .getPublicUrl(apkPath);

    // Créer l'objet application
    const newApp = {
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
    const { data, error } = await supabase
      .from('apps')
      .insert([newApp]);

    if (error) throw error;

    showMessage('Application ajoutée avec succès !', 'success');
    return data[0].id;
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
      const iconPath = `apps/icons/${Date.now()}_${iconFile.name}`;
      const { data: iconData, error: iconError } = await supabase.storage
        .from('appstore')
        .upload(iconPath, iconFile);

      if (iconError) throw iconError;

      // Obtenir l'URL de l'icône
      const { data: iconUrl } = supabase.storage
        .from('appstore')
        .getPublicUrl(iconPath);

      updateData.icon = iconUrl.publicUrl;
    }

    if (bannerFile) {
      const bannerPath = `apps/banners/${Date.now()}_${bannerFile.name}`;
      const { data: bannerData, error: bannerError } = await supabase.storage
        .from('appstore')
        .upload(bannerPath, bannerFile);

      if (bannerError) throw bannerError;

      // Obtenir l'URL de la bannière
      const { data: bannerUrl } = supabase.storage
        .from('appstore')
        .getPublicUrl(bannerPath);

      updateData.banner = bannerUrl.publicUrl;
    }

    if (screenshotFiles && screenshotFiles.length > 0) {
      const screenshotUrls = [];
      for (const file of screenshotFiles) {
        const screenshotPath = `apps/screenshots/${Date.now()}_${file.name}`;
        const { data: screenshotData, error: screenshotError } = await supabase.storage
          .from('appstore')
          .upload(screenshotPath, file);

        if (screenshotError) throw screenshotError;

        // Obtenir l'URL de la capture d'écran
        const { data: screenshotUrl } = supabase.storage
          .from('appstore')
          .getPublicUrl(screenshotPath);

        screenshotUrls.push(screenshotUrl.publicUrl);
      }

      updateData.screenshots = screenshotUrls;
    }

    if (apkFile) {
      const apkPath = `apps/apk/${Date.now()}_${apkFile.name}`;
      const { data: apkData, error: apkError } = await supabase.storage
        .from('appstore')
        .upload(apkPath, apkFile);

      if (apkError) throw apkError;

      // Obtenir l'URL de l'APK
      const { data: apkUrl } = supabase.storage
        .from('appstore')
        .getPublicUrl(apkPath);

      updateData.apk_file = apkUrl.publicUrl;
    }

    // Mettre à jour l'application dans la base de données
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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

// Exporter les fonctions
export {
  loadApps,
  getAppById,
  downloadApp,
  addApp,
  updateApp,
  deleteApp,
  appsData,
  createAppCard,
  generateStars
};
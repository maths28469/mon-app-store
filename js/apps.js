// apps.js - Gestion des applications

// Données de démonstration (à remplacer par une API ou une base de données)
const appsData = [
    {
        id: 'app1',
        name: 'SuperCalc',
        developer: 'VotrePseudo',
        shortDescription: 'Une calculatrice scientifique avancée avec des fonctionnalités uniques.',
        fullDescription: 'SuperCalc est une calculatrice scientifique avancée qui offre toutes les fonctionnalités dont vous avez besoin pour vos calculs quotidiens et scientifiques. Elle propose une interface intuitive, des thèmes personnalisables et prend en charge les expressions complexes avec une précision maximale. Utilisez SuperCalc pour vos études, votre travail ou simplement pour calculer rapidement.',
        icon: 'assets/apps/app1/icon.png',
        banner: 'assets/apps/app1/banner.jpg',
        screenshots: [
            'assets/apps/app1/screenshots/screen1.jpg',
            'assets/apps/app1/screenshots/screen2.jpg',
            'assets/apps/app1/screenshots/screen3.jpg',
        ],
        category: 'Productivité',
        rating: 4.5,
        downloads: 5000,
        version: '1.2.3',
        size: '5.2 MB',
        releaseDate: '2025-01-15',
        apkFile: 'assets/apps/app1/supercalc.apk',
        featured: true
    },
    {
        id: 'app2',
        name: 'FotoEdit Pro',
        developer: 'VotrePseudo',
        shortDescription: 'Éditeur de photos professionnel avec des filtres uniques et des outils avancés.',
        fullDescription: 'FotoEdit Pro est l\'application d\'édition de photos la plus complète sur mobile. Elle propose des centaines de filtres, des outils professionnels de retouche, et des fonctionnalités innovantes pour transformer vos photos ordinaires en œuvres d\'art. L\'interface intuitive permet aux débutants comme aux professionnels de retoucher leurs photos rapidement et efficacement. Ajoutez des effets, recadrez, ajustez les couleurs et partagez directement sur vos réseaux sociaux favoris.',
        icon: 'assets/apps/app2/icon.png',
        banner: 'assets/apps/app2/banner.jpg',
        screenshots: [
            'assets/apps/app2/screenshots/screen1.jpg',
            'assets/apps/app2/screenshots/screen2.jpg',
            'assets/apps/app2/screenshots/screen3.jpg',
            'assets/apps/app2/screenshots/screen4.jpg',
        ],
        category: 'Photo & Vidéo',
        rating: 4.8,
        downloads: 12500,
        version: '2.0.1',
        size: '25.7 MB',
        releaseDate: '2025-03-10',
        apkFile: 'assets/apps/app2/fotoedit_pro.apk',
        featured: true
    },
    {
        id: 'app3',
        name: 'TaskMaster',
        developer: 'VotrePseudo',
        shortDescription: 'Organisez votre vie avec cette application de gestion de tâches intuitive.',
        fullDescription: 'TaskMaster est votre assistant personnel pour rester organisé et productif. Créez des listes de tâches, définissez des priorités, ajoutez des rappels et suivez votre progression. L\'application propose des fonctionnalités avancées comme les tâches récurrentes, les projets, les étiquettes et les statistiques de productivité. Synchronisez vos données sur tous vos appareils et ne manquez plus jamais une échéance importante.',
        icon: 'assets/apps/app3/icon.png',
        banner: 'assets/apps/app3/banner.jpg',
        screenshots: [
            'assets/apps/app3/screenshots/screen1.jpg',
            'assets/apps/app3/screenshots/screen2.jpg',
            'assets/apps/app3/screenshots/screen3.jpg',
        ],
        category: 'Productivité',
        rating: 4.2,
        downloads: 3200,
        version: '1.5.0',
        size: '8.3 MB',
        releaseDate: '2024-12-05',
        apkFile: 'assets/apps/app3/taskmaster.apk',
        featured: false
    }
];

// Afficher les applications sur la page d'accueil
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si nous sommes sur la page d'accueil
    const featuredAppsContainer = document.getElementById('featured-apps-container');
    const allAppsContainer = document.getElementById('all-apps-container');

    if (featuredAppsContainer && allAppsContainer) {
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
function getAppById(id) {
    return appsData.find(app => app.id === id);
}

// Télécharger une application
function downloadApp(appId) {
    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = checkAuthStatus();

    if (!isLoggedIn) {
        // Afficher le modal de connexion
        document.getElementById('login-modal').style.display = 'flex';
        return false;
    }

    const app = getAppById(appId);

    if (app) {
        // Créer un lien de téléchargement
        const downloadLink = document.createElement('a');
        downloadLink.href = app.apkFile;
        downloadLink.download = app.name.replace(/\s+/g, '_').toLowerCase() + '.apk';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Incrémenter le compteur de téléchargements (uniquement dans un environnement réel)
        // app.downloads++;

        showMessage(`Téléchargement de ${app.name} démarré !`, 'success');
        return true;
    }

    showMessage('Application non trouvée.', 'error');
    return false;
}
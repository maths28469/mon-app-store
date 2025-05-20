// main.js - Fonctions principales du site avec Supabase

// Obtenir un paramètre de l'URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Formater le nombre de téléchargements
function formatDownloads(downloads) {
    if (downloads >= 1000000) {
        return (downloads / 1000000).toFixed(1) + ' M';
    } else if (downloads >= 1000) {
        return (downloads / 1000).toFixed(1) + ' k';
    } else {
        return downloads.toString();
    }
}

// Formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// Gestion du modal de connexion
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeBtn = document.querySelector('.close');
    const loginLink = document.getElementById('login-link');

    // Ouvrir le modal de connexion
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'flex';
        });
    }

    // Fermer le modal quand on clique sur la croix
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }

    // Fermer le modal quand on clique en dehors du contenu
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // Si on a un lien de connexion (page d'inscription), l'ouvrir aussi
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'flex';
        });
    }
});

// Exporter les fonctions
export {
    getUrlParameter,
    formatDownloads,
    formatDate
};
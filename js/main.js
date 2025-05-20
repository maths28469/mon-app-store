// main.js - Fonctions principales du site

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

    // Vérifier si l'utilisateur est connecté
    checkAuthStatus();
});

// Fonctions utilitaires
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
            <div class="app-description">${app.shortDescription}</div>
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

// Afficher des messages à l'utilisateur
function showMessage(message, type = 'info') {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${type}`;
    messageContainer.textContent = message;

    document.body.appendChild(messageContainer);

    // Afficher le message pendant 3 secondes
    setTimeout(() => {
        messageContainer.remove();
    }, 3000);
}
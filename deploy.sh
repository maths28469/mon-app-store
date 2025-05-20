#!/bin/bash
# Script pour déployer l'App Store sur Firebase

# Installer les dépendances
npm install

# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Déployer les règles Storage
firebase deploy --only storage:rules

# Déployer l'hébergement
firebase deploy --only hosting

echo "Déploiement terminé ! Votre App Store est maintenant en ligne."

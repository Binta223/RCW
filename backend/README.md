# Projet Coiffure - Architecture Microservices

## Structure du Projet

\\\
backend/
├── api-gateway/           # Point d'entrée de l'API
├── services/              # Services métiers
│   ├── auth-service/      # Authentification et autorisation
│   ├── user-service/      # Gestion des utilisateurs
│   ├── booking-service/   # Gestion des réservations
│   ├── analytics-service/ # Analyses et rapports
│   └── notification-service/ # Notifications
└── shared/               # Code partagé entre les services
\\\

## Prérequis

- Docker et Docker Desktop pour Windows
- Node.js 16+
- Python 3.8+ (pour certains services)

## Installation

1. Cloner le dépôt
2. Copier les fichiers d'environnement :
   \\\ash
   copy .env.example .env
   \\\
3. Démarrer les services :
   \\\ash
   docker-compose up -d
   \\\"

## Développement

Voir la documentation de chaque service pour plus de détails.

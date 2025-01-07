# Mon Vieux Grimoire 
---
## Scénario
Ce projet m'amène à développer le back-end d'un site de notation de livres. 
Mon rôle sera de créer un serveur avec Express et de le connecter à une base de données MongoDB. Cela impliquera la mise en place de la structure du serveur et la gestion de la communication entre le serveur et la base de données.
Je développere les modèles de données et implémenterez des opérations CRUD pour la gestion des livres et des notations. Cela nécessitera une attention particulière à la sécurité des données et à leur stockage sécurisé.
Je dois implémenter un système d'authentification sécurisé pour les utilisateurs du site. 
Le projet comprendra également la gestion du téléchargement et de l'optimisation des images, ainsi que l'ajout de fonctionnalités pour noter les livres et calculer la note moyenne.
Je dois respecter les bonnes pratiques du Green Code pour réduire l'empreinte écologique du site.
Pour compléter le projet, je dois utiliser Mongoose pour modéliser les données MongoDB, et suivre une architecture MVC (Modèle-Vue-Contrôleur) pour structurer mon application.

---

## Outils et technologies
- **Front-end** : HTML5, CSS3, JavaScript
- **Back-end** : Node.js, Express.js
- **Base de données** : MongoDB (via Mongoose)
- **Autres outils** : Postman pour tester l'API

---

## Ressources
- **Figma** : [Maquette - Mon vieux grimoire](https://www.figma.com/design/Snidyc45xi6qchoOPabMA9/Maquette-Mon-Vieux-Grimoir?node-id=0-1&p=f)  
- **Code front-end du projet** : [GitHub - Mon vieux grimoire](https://github.com/OpenClassrooms-Student-Center/P7-Dev-Web-livres)  
- **Spécifications fonctionnelles et techniques du site** : [Documentation spécifications fonctionnelles](https://course.oc-static.com/projects/D%C3%A9veloppeur+Web/DW_P7+Back-end/DW+P7+Back-end+-+Specifications+fonctionnelles.pdf)  
- **Spécifications techniques de l'API** : [Documentation spécifications techniques](https://course.oc-static.com/projects/D%C3%A9veloppeur+Web/DW_P7+Back-end/DW+P7+Back-end+-+Specifications+API.pdf)  

---

## Fonctionnalités
- **Gestion des livres** : Création, modification et suppression de livres.
- **Notation des livres** : Les utilisateurs peuvent attribuer une note et consulter la moyenne des évaluations.
- **Authentification sécurisée** : Gestion des utilisateurs avec cryptage des mots de passe et utilisation de tokens JWT.
- **Gestion des images** : Téléchargement et optimisation des images associées aux livres.

---

## Étapes du projet

### 1. Mise en place du serveur Node.js et Express
- Installation et configuration d’un environnement de développement avec Node.js, NPM et les dépendances nécessaires.
- Création d’une première application Express et test de son bon fonctionnement.
- Mise en place d’un système de routage simple pour gérer les requêtes HTTP.

### 2. Connexion à MongoDB et modèle de données
- Installation et configuration de MongoDB pour la base de données.
- Connexion de l’application Express à la base de données avec Mongoose.
- Création d’un modèle `Book` conforme aux spécifications techniques fournies, incluant les propriétés nécessaires.
- Implémentation des routes CRUD permettant :
  - La création de livres.
  - La récupération de livres individuels ou d’une liste.
  - La mise à jour des informations d’un livre existant.
  - La suppression d’un livre.

### 3. Implémentation de l'authentification
- Création d’un modèle utilisateur pour stocker les informations dans la base.
- Mise en place du cryptage des mots de passe avec la bibliothèque `bcrypt`.
- Génération de tokens JWT pour authentifier les requêtes et sécuriser les données utilisateur.
- Développement d’un middleware d’authentification protégeant les routes sensibles.

### 4. Gestion des images
- Intégration de la bibliothèque `Multer` pour permettre le téléchargement d’images par les utilisateurs.
- Optimisation des images téléchargées avec `Sharp` pour réduire leur poids et améliorer les performances.
- Gestion des chemins de stockage et des noms de fichiers pour éviter les conflits.

### 5. Notation des livres et calcul de la moyenne
- Ajout d’un tableau `ratings` dans le modèle `Book` pour stocker les évaluations des utilisateurs.
- Développement d’une fonctionnalité permettant à chaque utilisateur d’attribuer une seule note par livre.
- Mise en place d’une validation pour empêcher les doublons de notation par un même utilisateur.
- Calcul dynamique de la note moyenne d’un livre à chaque ajout ou modification d’une note, avec stockage dans la propriété `averageRating`.

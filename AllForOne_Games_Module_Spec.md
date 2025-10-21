# Spécification Fonctionnelle – Module « Jeux » de AllForOne

## 1. Aperçu du Module « Jeux »

Le module Jeux d’AllForOne rassemble les expériences multijoueurs de la plateforme et assure
une intégration étroite avec ses fonctionnalités sociales. Inspiré de Plato, il propose au
lancement trois jeux : **UNO**, **UNO – No Mercy** et **Dérocher**. Les utilisateurs peuvent y
rejoindre des parties publiques ou privées, inviter leurs amis et discuter via le chat intégré,
tout en conservant une expérience fluide sur mobile.

## 2. Fonctionnalités Générales du Module Jeux

- **Accès et navigation** : l’onglet Jeux de la barre principale mène à un catalogue qui répertorie
  les titres disponibles avec icône, description courte et nombre de joueurs connectés.
- **Interface principale** : l’écran présente des filtres (catégorie, durée, tour par tour) et un
  champ de recherche pour trouver rapidement un jeu ou une partie.
- **Recherche de parties** : un navigateur liste les parties publiques en cours ou en attente. Les
  joueurs peuvent filtrer par jeu, mode, langue ou niveau.
- **Rejoindre une partie** : un simple tap permet d’intégrer une partie publique libre ou d’envoyer
  une demande à l’hôte/entrée de mot de passe pour une partie privée.
- **Notifications** : invitations, lancement imminent, rappel de tour (asynchrone) et invitations
  d’amis déclenchent des notifications configurables par l’utilisateur.
- **Messagerie intégrée** : chaque partie inclut un chat texte avec emojis et filtrage automatique.
  Les salons publics et messages privés restent disponibles hors partie pour préparer les sessions.

## 3. Modes de Jeu : Temps Réel vs Tour par Tour

- **Temps réel** : UNO et UNO – No Mercy se jouent en sessions synchrones avec minuterie optionnelle
  (par défaut 20 s par tour). Un dépassement déclenche une action automatique (piocher dans UNO).
- **Tour par tour** : Dérocher prend en charge un mode asynchrone permettant de jouer au rythme de
  chacun. Une limite de temps étendue (quelques heures) s’applique avant pénalité ou abandon.
- **Modes mixtes** : Dérocher peut également se jouer en temps réel, le choix étant effectué lors de
  la création de partie et clairement indiqué dans les listes.

## 4. Création de Parties (Privées, Publiques, Classées)

Lors de la création, l’hôte configure :

1. **Type de partie**
   - *Privée* : accès par invitation/code, option mot de passe.
   - *Publique* : visible dans la liste et rejoignable librement, sans impact classement.
   - *Classée* : partie compétitive avec matchmaking par niveau et impact sur le rang.
2. **Jeu et mode** : sélection parmi UNO (temps réel), UNO – No Mercy (temps réel) et Dérocher (temps
   réel ou asynchrone).
3. **Nombre de joueurs** : paramètres dépendants du jeu (UNO/No Mercy : 2–6, Dérocher : 2–4).
4. **Options avancées** : règles spécifiques (règle de cumul, variantes Dérocher, etc.).

Un récapitulatif valide les paramètres avant lancement. Le bouton « Lancer » reste inactif tant que
le minimum de joueurs n’est pas atteint.

## 5. Système de Matchmaking Automatique

- **Match rapide** : rejoint une partie publique existante ou crée automatiquement une salle adaptée.
- **Invitations d’amis** : depuis le lobby, l’hôte peut réserver un emplacement et envoyer une
  notification instantanée à ses amis.
- **Groupes** : le système prévoit l’extension à des modes en équipe (2v2, etc.) avec matchmaking
  groupé.
- **Algorithme** : en classé, l’ELO interne équilibre les niveaux ; en casual, priorité à la rapidité
  et à la proximité (latence/langue).
- **Temps d’attente** : l’interface affiche un délai estimé, permet d’annuler et notifie lorsque la
  partie est complète.

## 6. Déroulement et Règles des Jeux

### 6.1 UNO (Classique)

- **Mise en place** : 108 cartes, 7 cartes par joueur, première carte de la défausse révélée.
- **Tour** : jouer une carte correspondant à la couleur ou au symbole sinon piocher (avec option
  « piocher jusqu’à pouvoir jouer » désactivée par défaut).
- **Cartes spéciales** : Inversion, Passe, +2, Joker, +4 avec validation des conditions de jeu.
- **UNO / Contre-UNO** : bouton UNO contextuel et pénalité automatique de +2 si oubli signalé.
- **Victoire** : première place à se vider de ses cartes. Mode score cumulatif jusqu’à 500 points
  optionnel.

### 6.2 UNO – No Mercy

- **Règles de base** : héritées d’UNO, avec cumul obligatoire des cartes +X.
- **Cartes supplémentaires** : +6, +10, Passer tout le monde, Défausse totale, Joker Inversion +4,
  Roulette des couleurs, règles 7-0.
- **Règle de pitié** : un joueur atteignant 25 cartes est éliminé; victoire possible par survie.
- **Interface** : icônes explicites, rappels d’effets, messages de journal pour suivre les éliminations
  et combos.

### 6.3 Dérocher

- **Concept** : retirer des blocs d’une structure sans la faire s’effondrer.
- **Tour** : choisir un bloc, tenter le retrait (moteur de stabilité simplifié), points accordés selon
  la difficulté.
- **Chutes partielles** : pénalité légère; blocs tombés retirés du jeu.
- **Effondrement total** : fin de manche immédiate. Modes disponibles :
  - *Survie* : le joueur fautif perd, le dernier joueur restant gagne.
  - *Score* : pénalité importante mais possibilité de continuer en manches successives.
- **Interface** : vue 2D/3D manipulable, historique des coups, chronomètre en temps réel, lecture seule
  en mode asynchrone hors tour.

## 7. Gestion des Connexions et Déconnexions

- **Reconnexion** : fenêtre de grâce (30–60 s) pour revenir sans perdre sa place, bouton « Reprendre »
  à l’ouverture de l’app.
- **Abandon** : confirmation nécessaire. En UNO/No Mercy, abandon = défaite (impact classement) et la
  partie continue; remplacement éventuel par IA paramétrable.
- **Inactivité** : expulsions automatiques après plusieurs tours manqués avec avertissements.
- **Hôte** : transfert du rôle d’hôte si nécessaire, fermeture de salle si l’hôte privé part avant le
  lancement.
- **Fin prématurée** : si un seul joueur reste, victoire par forfait; message clair aux autres.

## 8. Score, Progression et Récompenses

- **XP global** : toutes les parties octroient de l’expérience, avec bonus en cas de victoire ou mode
  classé.
- **Niveaux** : progression continue affichée sur le profil, déblocage potentiel de récompenses
  cosmétiques.
- **Classements** : par jeu (mode classé) avec ligues type Bronze → Diamant, et classement global XP.
- **Badges** : succès thématiques (ex. Champion UNO, Survivant No Mercy, Cascadeur Dérocher) visibles
  sur le profil.
- **Défis** : missions quotidiennes/hebdomadaires incitant à jouer différents modes.
- **Résumé post-partie** : XP, rangs, badges, statistiques clés (temps, actions marquantes).

## 9. Interactions Sociales et Communauté

- **Chat in-game** : bulles texte/emoji, messages rapides, filtrage automatique et signalement.
- **Liste d’amis** : visibilité du statut, invitations instantanées, groupes/club avec chat persistant.
- **Feedback de partie** : notation globale, kudos entre joueurs, système de signalement.
- **Rendez-vous** : planification d’une session future avec rappel par notification.
- **Profils** : accès depuis le lobby ou les résultats pour ajouter en ami, consulter badges et stats.

---

Cette spécification s’appuie sur les règles officielles d’UNO et UNO Show ’Em No Mercy ainsi que sur
les fonctionnalités sociales populaires de Plato, adaptées à l’identité moderne et inclusive
d’AllForOne.

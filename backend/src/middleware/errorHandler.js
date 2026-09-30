// Middleware de gestion d'erreurs global
export function errorHandler(err, req, res, next) {
  console.error('Erreur:', err);

  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Données invalides',
      details: err.message,
    });
  }

  // Erreur de ressource non trouvée
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Ressource non trouvée',
      details: err.message,
    });
  }

  // Erreur d'authentification
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Non authentifié',
      details: err.message,
    });
  }

  // Erreur d'autorisation
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Accès refusé',
      details: err.message,
    });
  }

  // Erreur de conflit (ex: livre déjà emprunté)
  if (err.name === 'ConflictError') {
    return res.status(409).json({
      error: 'Conflit',
      details: err.message,
    });
  }

  // JSON malformé dans le corps de la requête
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'JSON invalide',
      details: 'Le corps de la requête n\'est pas un JSON valide',
    });
  }

  // Erreur interne du serveur
  res.status(err.status || 500).json({
    error: 'Erreur interne du serveur',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue',
  });
}

// Middleware pour les routes non trouvées
export function notFound(req, res) {
  res.status(404).json({
    error: 'Route non trouvée',
    details: `La route ${req.method} ${req.originalUrl} n'existe pas`,
  });
}

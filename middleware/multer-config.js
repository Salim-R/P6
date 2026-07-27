const path = require('path');
const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const TAILLE_MAX = 2 * 1024 * 1024; // 2 Mo

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    // On repart du nom d'origine sans son extension, nettoye de tout ce qui
    // n'est pas alphanumerique : le nom fourni par le client ne doit jamais
    // pouvoir influencer le chemin d'ecriture.
    const base = path
      .parse(file.originalname)
      .name.replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 60);

    const extension = MIME_TYPES[file.mimetype];
    callback(null, `${base}_${Date.now()}.${extension}`);
  },
});

// Sans ce filtre, un fichier d'un type non prevu etait enregistre avec une
// extension "undefined".
const fileFilter = (req, file, callback) => {
  if (!MIME_TYPES[file.mimetype]) {
    const error = new Error('Format d image non supporte (jpg, png, webp)');
    error.status = 400;
    return callback(error);
  }
  return callback(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: TAILLE_MAX },
}).single('image');

const multer = require('multer');
//config de multer 

//le dictionnaire de mime types
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};
//la destination du fichier
const storage = multer.diskStorage({
  //la destination de stockage
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, `${name}_${Date.now()}.${extension}`);
  }
});

module.exports = multer({ storage: storage }).single('image');
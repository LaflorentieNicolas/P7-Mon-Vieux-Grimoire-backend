const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

// Fonction pour nettoyer le nom du fichier
const cleanString = (str) => str.replace(/[^a-zA-Z0-9_]/g, "");

// Configurer le stockage en mémoire
const storage = multer.memoryStorage();

// Créez un middleware pour gérer les fichiers
const upload = multer({ storage: storage }).single("image");

// Middleware pour traiter l'image
const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Nettoyer le nom du fichier et ajouter un timestamp
    const nameWithoutExtension = req.file.originalname
      .split(" ")
      .join("_")
      .split(".")
      .slice(0, -1)
      .join(".");
    const cleanedString = cleanString(nameWithoutExtension);
    const currentTimeStamp = Date.now();
    const fullImgName = `${cleanedString}_${currentTimeStamp}.webp`;

    // Définir le chemin de sortie
    const outputPath = path.join("images", fullImgName);

    // Traiter l'image avec sharp et enregistrement
    await sharp(req.file.buffer)
      .toFormat("webp")
      .webp({ quality: 60 })
      .toFile(outputPath);

    // Ajouter le nom du fichier et le chemin au req.file
    req.file.filename = fullImgName;
    req.file.path = outputPath;

    next();
  } catch (err) {
    next(err);
  }
};

// Exporter le middleware configuré
module.exports = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: "Error uploading file" });
    }
    processImage(req, res, next);
  });
};

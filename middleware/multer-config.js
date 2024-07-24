const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage }).single("image");

const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const filename =
      req.file.originalname.split(" ").join("_").split(".")[0] +
      Date.now() +
      ".webp";
    const outputPath = path.join("images", filename);

    await sharp(req.file.buffer)
      .toFormat("webp")
      .webp({ quality: 60 })
      .toFile(outputPath);

    req.file.filename = filename;
    req.file.path = outputPath;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: "Error uploading file" });
    }
    processImage(req, res, next);
  });
};

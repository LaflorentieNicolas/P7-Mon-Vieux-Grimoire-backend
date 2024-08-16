const fs = require("fs");
const Book = require("../models/book");

function deleteUploadedFile(file) {
  if (file) {
    fs.unlink(`images/${file.filename}`, (err) => {
      if (err) console.error("Erreur lors de la suppression de l'image:", err);
    });
  }
}

exports.createBook = (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);

    // Vérification des champs requis
    const missingFields =
      !bookObject.title?.trim() ||
      !bookObject.author?.trim() ||
      !bookObject.year ||
      !bookObject.genre?.trim() ||
      !req.file;

    // Vérification de l'année (1 à 4 chiffres) et qu'elle ne dépasse pas l'année en cours
    const currentYear = new Date().getFullYear();
    const validYear =
      /^\d{1,4}$/.test(bookObject.year) &&
      Number(bookObject.year) <= currentYear;

    if (missingFields || !validYear) {
      // Supprimer l'image téléchargée
      deleteUploadedFile(req.file);
      return res.status(400).json({
        message: "Tous les champs sont requis, y compris l'image.",
      });
    }

    const book = new Book({
      userId: req.auth.userId,
      title: bookObject.title.trim(),
      author: bookObject.author.trim(),
      year: bookObject.year,
      genre: bookObject.genre.trim(),
      ratings: [
        { userId: req.auth.userId, grade: bookObject.ratings[0].grade },
      ],
      averageRating: bookObject.ratings[0].grade,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
    });

    book
      .save()
      .then(() => res.status(201).json({ message: "Livre enregistré !" }))
      .catch((error) => {
        deleteUploadedFile(req.file);
        res.status(500).json({
          message: "Erreur lors de l'enregistrement du livre.",
          error,
        });
      });
  } catch (error) {
    deleteUploadedFile(req.file);
    res.status(400).json({
      message: "Requête invalide. Vérifiez les données envoyées.",
      error,
    });
  }
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.modifyBook = (req, res, next) => {
  const isImageProvided = !!req.file;

  // Rechercher le livre pour obtenir les valeurs actuelles des champs
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        if (isImageProvided) {
          deleteUploadedFile({ filename: req.file.filename });
        }
        return res.status(404).json({ message: "Livre non trouvé." });
      }

      if (book.userId !== req.auth.userId) {
        if (isImageProvided) {
          deleteUploadedFile({ filename: req.file.filename });
        }
        return res.status(403).json({ message: "403: unauthorized request" });
      }

      // Conserver les valeurs actuelles pour les champs non envoyés dans la requête
      const bookObject = {
        title: req.body.title ? req.body.title.trim() : book.title,
        author: req.body.author ? req.body.author.trim() : book.author,
        year: req.body.year ? req.body.year : book.year,
        genre: req.body.genre ? req.body.genre.trim() : book.genre,
      };

      const currentYear = new Date().getFullYear();
      const validYear =
        /^\d{1,4}$/.test(bookObject.year) &&
        Number(bookObject.year) <= currentYear;

      if (
        !bookObject.title ||
        !bookObject.author ||
        !bookObject.year ||
        !bookObject.genre ||
        !validYear
      ) {
        if (isImageProvided) {
          deleteUploadedFile({ filename: req.file.filename });
        }
        return res.status(400).json({
          message: "Tous les champs sont requis ou l'année est invalide.",
        });
      }

      // Si une nouvelle image est fournie, supprimer l'ancienne
      if (isImageProvided) {
        deleteUploadedFile({ filename: book.imageUrl.split("/images/")[1] });
      }

      // Mettre à jour le livre avec les nouvelles données
      Book.updateOne(
        { _id: req.params.id },
        {
          ...bookObject,
          _id: req.params.id,
          imageUrl: isImageProvided
            ? `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
            : book.imageUrl,
        }
      )
        .then(() => res.status(200).json({ message: "Livre modifié !" }))
        .catch((error) =>
          res.status(500).json({
            message: "Erreur lors de la modification du livre.",
            error,
          })
        );
    })
    .catch((error) =>
      res
        .status(500)
        .json({ message: "Erreur lors de la recherche du livre.", error })
    );
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        return res.status(403).json({ message: "403: unauthorized request" });
      }

      deleteUploadedFile({ filename: book.imageUrl.split("/images/")[1] });

      Book.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: "Livre supprimé !" }))
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(500).json({ error }));
};

exports.rateBook = (req, res, next) => {
  const { rating } = req.body;

  // Vérifier que la note est comprise entre 0 et 5
  if (rating < 0 || rating > 5) {
    return res
      .status(400)
      .json({ message: "La note doit-être comprise entre 0 et 5." });
  }

  // Rechercher le livre par ID
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé." });
      }

      // Vérifier si l'utilisateur a déjà noté ce livre
      const userRating = book.ratings.find((r) => r.userId === req.auth.userId);
      if (userRating) {
        return res
          .status(400)
          .json({ message: "Vous avez déjà noté ce livre." });
      }

      // Ajouter la nouvelle note
      book.ratings.push({ userId: req.auth.userId, grade: rating });

      // Calculer la nouvelle note moyenne et arrondir à deux chiffres après la virgule
      const totalRatings = book.ratings.reduce((sum, r) => sum + r.grade, 0);
      book.averageRating =
        Math.round((totalRatings / book.ratings.length) * 10) / 10;

      // Sauvegarder le livre avec la nouvelle note
      book
        .save()
        .then(() => res.status(200).json(book))
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(500).json({ error }));
};

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

    const missingFields =
      !bookObject.title ||
      !bookObject.author ||
      !bookObject.year ||
      !bookObject.genre ||
      !req.file;
    if (missingFields) {
      deleteUploadedFile(req.file);
      return res
        .status(400)
        .json({ message: "Tous les champs sont requis, y compris l'image." });
    }

    const book = new Book({
      userId: req.auth.userId,
      title: bookObject.title,
      author: bookObject.author,
      year: bookObject.year,
      genre: bookObject.genre,
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
  const bookObject = isImageProvided
    ? {
        title: req.body.title,
        author: req.body.author,
        year: req.body.year,
        genre: req.body.genre,
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : {
        title: req.body.title,
        author: req.body.author,
        year: req.body.year,
        genre: req.body.genre,
      };

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé." });
      }

      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "403: unauthorized request" });
      }

      if (isImageProvided) {
        deleteUploadedFile({ filename: book.imageUrl.split("/images/")[1] });
      }

      Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id }
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
        Math.round((totalRatings / book.ratings.length) * 100) / 100;

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

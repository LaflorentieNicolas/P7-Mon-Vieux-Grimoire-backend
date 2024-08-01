const Book = require("../models/book");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Livre enregistré !" });
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: "403: unauthorized request" });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Livre modifié !" }))
          .catch((error) => res.status(500).json({ error }));
      }
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: "403: unauthorized request" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Livre supprimé !" });
            })
            .catch((error) => res.status(500).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
};

exports.rateBook = (req, res, next) => {
  const { rating } = req.body; // Extraction de la note de la requête
  // Vérification que la note est comprise entre 0 et 5
  if (rating < 0 || rating > 5) {
    return res
      .status(400)
      .json({ message: "La note doit-être comprise entre 0 et 5" });
  }

  // Recherche du livre dans la base de données par son ID
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      // Si le livre n'est pas trouvé, retourner une réponse 404
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé." });
      }

      // Vérifier si l'utilisateur a déjà noté ce livre
      const userRating = book.ratings.find((r) => r.userId === req.auth.userId);
      if (userRating) {
        // Si l'utilisateur a déjà noté, retourner une réponse 400
        return res
          .status(400)
          .json({ message: "Vous avez déjà noté ce livre." });
      }

      // Ajouter la nouvelle note au tableau des notes du livre
      book.ratings.push({ userId: req.auth.userId, grade: rating });
      // Calculer la nouvelle note moyenne
      book.averageRating =
        book.ratings.reduce((sum, r) => sum + r.grade, 0) / book.ratings.length;

      // Enregistrer le livre mis à jour dans la base de données
      book
        .save()
        .then(() => res.status(200).json(book)) // Retourner le livre mis à jour en réponse
        .catch((error) => res.status(500).json({ error })); // Gérer les erreurs de sauvegarde
    })
    .catch((error) => res.status(500).json({ error })); // Gérer les erreurs de recherche du livre
};

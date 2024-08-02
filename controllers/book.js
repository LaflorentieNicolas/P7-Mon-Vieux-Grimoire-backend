const Book = require("../models/book");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);

    // Vérification des champs requis
    if (
      !bookObject.title ||
      !bookObject.author ||
      !bookObject.year ||
      !bookObject.genre ||
      !req.file
    ) {
      // Supprimer l'image téléchargée
      if (req.file) {
        fs.unlink(`images/${req.file.filename}`, (err) => {
          if (err)
            console.error("Erreur lors de la suppression de l'image:", err);
        });
      }
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
        // Supprimer l'image téléchargée en cas d'erreur lors de l'enregistrement
        if (req.file) {
          fs.unlink(`images/${req.file.filename}`, (err) => {
            if (err)
              console.error("Erreur lors de la suppression de l'image:", err);
          });
        }
        res.status(500).json({
          message: "Erreur lors de l'enregistrement du livre.",
          error,
        });
      });
  } catch (error) {
    // Supprimer l'image téléchargée en cas d'erreur
    if (req.file) {
      fs.unlink(`images/${req.file.filename}`, (err) => {
        if (err)
          console.error("Erreur lors de la suppression de l'image:", err);
      });
    }
    res.status(400).json({
      message: "Requête invalide. Vérifiez les données envoyées.",
      error,
    });
  }
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
  // Détermine si une nouvelle image est upload
  const isImageProvided = req.file;

  // Prépare les nouvelles données du livre, avec ou sans nouvelle image
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

  // Trouver le livre existant
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé." });
      }

      // Vérifie si l'utilisateur est autorisé à modifier le livre
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "403: unauthorized request" });
      }

      // Supprime l'ancienne image si une nouvelle image est upload
      if (isImageProvided) {
        const oldImageFilename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${oldImageFilename}`, (err) => {
          if (err) {
            console.error(
              "Erreur lors de la suppression de l'ancienne image:",
              err
            );
          }
        });
      }

      // Met à jour le livre avec les nouvelles données
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

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 }) // Trier par note moyenne décroissante
    .limit(3) // Limiter le résultat à 3 livres
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

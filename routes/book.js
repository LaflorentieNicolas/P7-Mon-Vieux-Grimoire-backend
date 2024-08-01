const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const uploadImage = require("../middleware/multer-config");
const bookCtrl = require("../controllers/book");

router.get("/", bookCtrl.getAllBooks);
router.get("/bestrating", bookCtrl.getBestRatedBooks);
router.post("/", auth, uploadImage, bookCtrl.createBook);
router.post("/:id/rating", auth, bookCtrl.rateBook);
router.get("/:id", bookCtrl.getOneBook);
router.put("/:id", auth, uploadImage, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);

module.exports = router;

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(
      token,
      "Wthngnk4/7rv+/UzucFfYu4qTX5pUKXskOtf06puqDx1nkLN++6Dr5WvgXnAgxzM"
    );
    const userId = decodedToken.userId;
    req.auth = {
      userId: userId,
    };
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};

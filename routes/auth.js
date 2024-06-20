const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { SECRET_KEY } = require("../config");
const User = require("../models/user");

const router = express.Router();

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async function (req, res, next) {
  const { username, password } = req.body;

  try {
    // Authenticate user
    const isValid = await User.authenticate(username, password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid username/password" });
    }

    // Update last_login_at timestamp
    await User.updateLoginTimestamp(username);

    // Generate JWT token
    const token = jwt.sign({ username }, SECRET_KEY);

    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async function (req, res, next) {
  const { username, password, first_name, last_name, phone } = req.body;

  try {
    // Register user
    const newUser = await User.register({
      username,
      password,
      first_name,
      last_name,
      phone,
    });

    // Update last_login_at timestamp
    await User.updateLoginTimestamp(username);

    // Generate JWT token
    const token = jwt.sign({ username }, SECRET_KEY);

    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

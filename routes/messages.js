const express = require("express");
const { authenticateJWT, ensureLoggedIn } = require("../middleware/auth");
const Message = require("../models/message");
const User = require("../models/user");

const router = express.Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get(
  "/:id",
  authenticateJWT,
  ensureLoggedIn,
  async function (req, res, next) {
    const { id } = req.params;
    const currentUser = req.user.username;

    try {
      const message = await Message.get(id);

      // Check if current user is either the sender or recipient of the message
      if (
        message.from_username !== currentUser &&
        message.to_username !== currentUser
      ) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Fetch user details for from_user and to_user
      const [fromUser, toUser] = await Promise.all([
        User.get(message.from_username),
        User.get(message.to_username),
      ]);

      return res.json({
        message: {
          id: message.id,
          body: message.body,
          sent_at: message.sent_at,
          read_at: message.read_at,
          from_user: {
            username: fromUser.username,
            first_name: fromUser.first_name,
            last_name: fromUser.last_name,
            phone: fromUser.phone,
          },
          to_user: {
            username: toUser.username,
            first_name: toUser.first_name,
            last_name: toUser.last_name,
            phone: toUser.phone,
          },
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post(
  "/",
  authenticateJWT,
  ensureLoggedIn,
  async function (req, res, next) {
    const { to_username, body } = req.body;
    const from_username = req.user.username; // Current logged-in user

    try {
      const message = await Message.create({
        from_username,
        to_username,
        body,
      });
      return res.status(201).json({ message });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

// POST /messages/:id/read - Mark message as read
router.post(
  "/:id/read",
  authenticateJWT,
  ensureLoggedIn,
  async function (req, res, next) {
    const { id } = req.params;
    const currentUser = req.user.username;

    try {
      const message = await Message.get(id);

      // Ensure current user is the intended recipient
      if (message.to_username !== currentUser) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Mark message as read
      const updatedMessage = await Message.markAsRead(id);

      return res.json({ message: updatedMessage });
    } catch (err) {
      return next(err);
    }
  }
);

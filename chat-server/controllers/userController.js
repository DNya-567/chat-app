const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.userId || req.body.userId;

    const updates = {};
    if (username) updates.username = username;

    if (req.file) {
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { updateProfile };


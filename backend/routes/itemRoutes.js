const express = require("express");
const Item = require("../models/Item");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/items/search?name=xyz → Search items by name
router.get("/search", auth, async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const items = await Item.find({
      itemName: { $regex: name, $options: "i" },
    }).populate("user", "name email");

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST /api/items → Add item
router.post("/", auth, async (req, res) => {
  try {
    const { itemName, description, type, location, date, contactInfo } =
      req.body;

    const item = new Item({
      itemName,
      description,
      type,
      location,
      date: date || Date.now(),
      contactInfo,
      user: req.user._id,
    });

    await item.save();
    res.status(201).json({ message: "Item added successfully", item });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/items → View all items
router.get("/", auth, async (req, res) => {
  try {
    const items = await Item.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/items/:id → View item by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT /api/items/:id → Update item
router.put("/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Only the owner can update
    if (item.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You can only update your own items" });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ message: "Item updated successfully", item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/items/:id → Delete item
router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Only the owner can delete
    if (item.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You can only delete your own items" });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;

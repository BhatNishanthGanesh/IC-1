const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  // name: String,
  name: { type: String, index: true },
  description: String,
  price: Number,
  image: String,
  category: { type: String, enum: ["veg", "non-veg", "dessert"] },
});

const Food = mongoose.model("Food", foodSchema);

module.exports = Food;

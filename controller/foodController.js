const Food = require("../models/food");

exports.getFoods = async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.searchFoodByLetters = async (req, res) => {
  const { letters } = req.params;

  try {
    const foods = await Food.find({ name: { $regex: new RegExp(`^${letters}`, 'i') } });

    if (!foods || foods.length === 0) {
      return res.status(404).json({ error: "No matching foods found" });
    }

    res.json(foods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.searchFoodByName = async (req, res) => {
  const { name } = req.params;

  try {
    // Use a regular expression for case-insensitive search
    const regex = new RegExp(name, 'i');

    const foods = await Food.find({ name: regex });

    if (!foods || foods.length === 0) {
      return res.status(404).json({ error: "No matching foods found" });
    }

    res.json(foods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.postFood = async (req, res) => {
  try {
    const { name, description, price, image,category } = req.body;

    // Validate the presence of required fields
    if (!name || !description || !price || !image || !category) {
      return res.status(400).json({ error: "Incomplete information for food item" });
    }

    // Create a new food item
    const newFood = new Food({
      name,
      description,
      price,
      image,
      category
    });

    // Save the food item to the database
    await newFood.save();

    res.status(201).json({ message: "Food item added successfully", food: newFood });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getFoodsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const foods = await Food.find({ category });
    res.json(foods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

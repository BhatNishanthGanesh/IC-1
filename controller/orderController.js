const mongoose = require("mongoose");
const Order = require("../models/order");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const upload = multer({ dest: 'uploads/' })
exports.placeOrder = async (req, res) => {
  try {
    const { userId, foodId, paymentMode, quantity } = req.body;

    // Convert userId to ObjectId
    const userIdObject = new mongoose.Types.ObjectId(userId);

    const newOrder = new Order({
      userId: userIdObject,
      foodId,
      paymentMode,
      quantity,
      orderId: generateOrderId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newOrder.save();

    res.json({
      success: true,
      message: "Order placed successfully",
      orderId: newOrder.orderId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// exports.submitFeedback = async (req, res) => {
//   try {
//     const { rating, imageLink } = req.body;
//     const orderId = req.params.orderId;

//     console.log("orderId:", orderId);

//     // Optional: Handle file upload and extract text data
//     const textData = await extractTextFromFile(req.file);

//     // Update order with feedback data
//     const updatedOrder = await Order.findByIdAndUpdate(
//       orderId,
//       {
//         rating,
//         imageLink,
//         fileData: textData ? textData.link : null,
//         updatedAt: new Date(),
//       },
//       { new: true }
//     );

//     console.log("updatedOrder:", updatedOrder);
//     const facebookResponse = await shareFeedbackOnFacebook(updatedOrder)

//     if (!updatedOrder) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     res.json({
//       success: true,
//       message: "Feedback submitted successfully",
//       updatedOrder,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

exports.submitFeedback = async (req, res) => {
    try {
        const { rating, imageLink } = req.body;
        const orderId = req.params.orderId;

        // Handle file upload
        upload.single('file')(req, res, async function (err) {
            if (err) {
                console.error('File upload error:', err);
                return res.status(500).json({ error: 'File upload error' });
            }

            try {
                // Extract text data from file
                const textData = await extractTextFromFile(req.file);

                // Update order with feedback data
                const updatedOrder = await Order.findByIdAndUpdate(orderId, {
                    rating,
                    imageLink,
                    fileData: textData ? textData.link : null,
                    updatedAt: new Date()
                }, { new: true });

                if (!updatedOrder) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                res.json({ success: true, message: 'Feedback submitted successfully', updatedOrder });
            } catch (error) {
                console.error('Error processing feedback:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

function generateOrderId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
}

async function extractTextFromFile(file) {
    if (!file || !file.path) {
        console.error('Error extracting text from file: File or file path is missing');
        return null;
    }

    try {
        // Read text from file
        const text = fs.readFileSync(file.path, 'utf-8');

        // Save extracted text to a new file
        const textFilePath = `uploads/text_${Date.now()}.txt`;
        fs.writeFileSync(textFilePath, text);

        return { link: textFilePath };
    } catch (error) {
        console.error('Error extracting text from file:', error);
        return null;
    }
}

async function shareFeedbackOnFacebook(order) {
  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    // Construct the Facebook Graph API endpoint for obtaining a user access token
    const tokenUrl = `https://graph.facebook.com/v12.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`;

    // Make a GET request to obtain an App Access Token
    const tokenResponse = await axios.get(tokenUrl);
    const appAccessToken = tokenResponse.data.access_token;

    // Construct the Facebook Graph API endpoint for posting a status
    const apiUrl = `https://graph.facebook.com/v12.0/me/feed`;

    // Data to be posted
    const postData = {
      message: `Just submitted feedback on my order with ID ${order.orderId}! Rating: ${order.rating} stars.`,
      access_token: appAccessToken,
    };

    // Make a POST request to the Facebook Graph API
    const response = await axios.post(apiUrl, postData);

    console.log("Feedback shared on Facebook:", response.data);
    return { success: true, message: "Feedback shared on Facebook" };
  } catch (error) {
    console.error("Error sharing feedback on Facebook:", error.response.data);
    return { success: false, error: "Failed to share feedback on Facebook" };
  }
}

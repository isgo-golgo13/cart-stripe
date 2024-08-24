import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
import path from "path";
import { fileURLToPath } from "url";

const stripe = new Stripe(""); // Replace with your actual live secret key

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prices = {
  black: 100, // $1.00 in cents
  red: 100, // $1.00 in cents
  silver: 100, // $1.00 in cents
};

app.post("/checkout", async (req, res) => {
  const { cart } = req.body;

  // Filter out items with a quantity of 0
  const line_items = Object.entries(cart)
    .filter(([_, quantity]) => quantity > 0)
    .map(([item, quantity]) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.charAt(0).toUpperCase() + item.slice(1)} Cube`,
        },
        unit_amount: prices[item],
      },
      quantity: quantity,
    }));

  if (line_items.length === 0) {
    return res.status(400).send("No valid items in cart.");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: "http://localhost:3000/success", // Replace with your actual success URL
      cancel_url: "http://localhost:3000/cancel", // Replace with your actual cancel URL
    });

    res.send(session.url); // Respond with the session URL for redirection
  } catch (error) {
    console.error("Error creating Stripe Checkout session:", error);
    res
      .status(500)
      .send("An error occurred while creating the checkout session.");
  }
});

app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "success.html"));
});

app.get("/cancel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cancel.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

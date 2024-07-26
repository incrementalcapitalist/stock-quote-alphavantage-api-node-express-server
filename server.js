const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const morgan = require("morgan"); // For logging

dotenv.config();

const app = express();
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_API_URL = "https://www.alphavantage.co/query";

if (!ALPHA_VANTAGE_API_KEY) {
  console.error(
    "ALPHA_VANTAGE_API_KEY is not defined in the environment variables.",
  );
  process.exit(1);
}

app.use(express.json());
app.use(morgan("dev")); // Logging middleware

app.get("/", (req, res) => {
  res.send(
    "Welcome to the Stock Quote API. Use /quote/:ticker to get a stock quote.",
  );
});

app.get("/quote/:ticker", async (req, res, next) => {
  const { ticker } = req.params;

  if (!ticker || typeof ticker !== "string" || ticker.length === 0) {
    return res.status(400).json({ error: "Invalid ticker symbol." });
  }

  try {
    const response = await axios.get(ALPHA_VANTAGE_API_URL, {
      params: {
        function: "GLOBAL_QUOTE",
        symbol: ticker,
        apikey: ALPHA_VANTAGE_API_KEY,
      },
    });

    const quoteData = response.data["Global Quote"];
    if (!quoteData || Object.keys(quoteData).length === 0) {
      return res
        .status(404)
        .json({ error: "No data found for the given ticker." });
    }

    res.json({
      symbol: quoteData["01. symbol"],
      open: quoteData["02. open"],
      high: quoteData["03. high"],
      low: quoteData["04. low"],
      price: quoteData["05. price"],
      volume: quoteData["06. volume"],
      latestTradingDay: quoteData["07. latest trading day"],
      previousClose: quoteData["08. previous close"],
      change: quoteData["09. change"],
      changePercent: quoteData["10. change percent"],
    });
  } catch (error) {
    next(error); // Pass the error to the centralized error handler
  }
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res
    .status(500)
    .json({ error: "An error occurred while fetching the quote." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down server gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

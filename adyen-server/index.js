const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const env = process.env.NODE_ENV || "dev";
dotenv.config({ path: `.env.${env}` });

const app = express();

const { PORT, HOST } = require("./config");

const options = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(options));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const adyenRouter = require("./routes/adyen.route");

app.use("/", (req, res, next) => {
  // console.log("Request received");
  next();
});

app.use("/api/adyen", adyenRouter);

app.use((err, req, res, next) => {
  console.error("Error occurred:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

async function startServer() {
  try {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

startServer();

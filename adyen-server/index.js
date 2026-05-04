const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const env = process.env.NODE_ENV || "dev";
dotenv.config({ path: `.env.${env}` });

const app = express();
const { PORT } = require("./config");
const migrate = require("./db/migrate");

app.use(cors({ origin: true, methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const adyenRouter = require("./routes/adyen.route");
const authRouter = require("./routes/auth.route");

app.use("/api/auth", authRouter);
app.use("/api/adyen", adyenRouter);

app.use((err, req, res, next) => {
  console.error("Error occurred:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

async function startServer() {
  try {
    await migrate();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();

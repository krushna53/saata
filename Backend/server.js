const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const verifyRecaptchaRoute = require("./api/verify-recaptcha"); // Ensure correct path

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", verifyRecaptchaRoute); // <-- Ensure this is set

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

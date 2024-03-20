const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// app.use(router);

app.use("/", authRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;

const express = require("express");
const dotenv = require("dotenv");
const emailRoutes = require("./routes/email");

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use("/add-3pid-email", emailRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

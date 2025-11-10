const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "OwanbePal API is running 🚀"
  });
});

app.listen(PORT, () => {
  console.log(`OwanbePal backend listening on http://localhost:${PORT}`);
});

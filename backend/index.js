const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const DB = path.join(__dirname, "data", "umkm.json");
function readDB() {
    return JSON.parse(fs.readFileSync(DB, "utf8"));
}

app.get("/api/umkm", (req, res) => {
    res.json(readDB());
});

app.listen(3000, () => console.log("Backend running on port 3000"));

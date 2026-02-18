const express = require("express");

const app = express();

//Middleware để đọc JSON body
app.use(express.json());

//test endpoint
app.get("/health", (req, res) => {
    res.json({ ok: true });
});

module.exports = app;


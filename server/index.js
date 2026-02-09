"use strict";

import express from "express";
import cors from "cors";
import http from "http";

const app = express();
const server = http.createServer(app);
app.use((req, res, next) => {
  return cors({
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    methods: "GET,PUT,POST",
    origin: req.headers.origin,
    exposedHeaders: ["Content-Type"],
  })(req, res, next);
});

// Add specific CORS headers for manifest.json
app.get("/manifest.json", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  next();
});

app.use(express.static("../client/dist"));

const PORT = process.env.PORT || 3233;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  socketIO.init(server);
  telegram.init();
});

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Guarda el ticket más reciente
let lastTicket = null;

// Comprobación básica
app.get("/", (req, res) => {
  res.send("✅ CloudPRNT server is running.");
});

// El kiosco envía el ticket aquí
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received:", ticket);

  res.json({
    ok: true,
    message: "Ticket stored successfully."
  });
});

/* ===========================================================
   STAR CLOUDPRNT REQUIRED ENDPOINTS (Case-sensitive)
   =========================================================== */

// 1️⃣ Printer checks if a job is available
app.get("/CloudPRNT", (req, res) => {
  if (!lastTicket) {
    return res.json({
      jobReady: false,
      deleteJob: false,
      mediaTypes: ["escpos"]
    });
  }

  res.json({
    jobReady: true,
    deleteJob: true,
    mediaTypes: ["escpos"]
  });
});

// 2️⃣ Printer requests the job itself
app.get("/CloudPRNT/Job", (req, res) => {
  if (!lastTicket) {
    return res.json({ jobReady: false });
  }

  const ticketText = lastTicket;

  const escpos =
    ticketText +
    "\n-----------------------------\n" +
    "Thank you!\n" +
    "\x1B\x64\x03";

  const job = {
    jobReady: true,
    type: "escpos",
    data: Buffer.from(escpos).toString("base64")
  };

  lastTicket = null; // limpiar para que no imprima dos veces

  res.json(job);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CloudPRNT server running on ${PORT}`);
});

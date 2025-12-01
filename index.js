const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Donde guardamos el ticket
let lastTicket = null;

// Página principal
app.get("/", (req, res) => {
  res.send("✅ Aldos CloudPRNT server is running.");
});

// Recibe tickets del kiosco
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received:");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored successfully." });
});


// ===============================
// CLOUDPRNT v3 STATUS ENDPOINT
// ===============================
app.get("/cloudprnt/status", (req, res) => {
  console.log("📡 Printer called /cloudprnt/status");

  const jobExists = !!lastTicket;

  res.set({
    "Star-CloudPRNT-JobReady": jobExists ? "1" : "0",
    "Star-CloudPRNT-MediaTypes": "escpos",
    "Star-CloudPRNT-DeleteJob": "1"
  });

  res.json({
    jobReady: jobExists,
    mediaTypes: ["escpos"],
    deleteJob: true
  });
});


// ===============================
// CLOUDPRNT v3 JOB ENDPOINT
// ===============================
app.get("/cloudprnt/job", (req, res) => {
  console.log("📡 Printer called /cloudprnt/job");

  if (!lastTicket) {
    return res.json({
      jobReady: false
    });
  }

  const ticketText = lastTicket;

  // Convertir ticket a ESC/POS
  const escpos =
    ticketText +
    "\n-----------------------------\n" +
    "Gracias!\n" +
    "\x1B\x64\x03"; // cortar papel

  const base64 = Buffer.from(escpos).toString("base64");

  // Headers obligatorios Star CloudPRNT
  res.set({
    "Content-Type": "application/json",
    "Star-CloudPRNT-JobReady": "1",
    "Star-CloudPRNT-DeleteJob": "1",
    "Star-CloudPRNT-MediaTypes": "escpos"
  });

  // ENTREGAMOS EL TICKET
  const response = {
    jobReady: true,
    job: {
      type: "escpos",
      data: base64
    }
  };

  console.log("📨 Sending job to printer...");
  console.log(response);

  // BORRAR ticket después de entregarlo
  lastTicket = null;

  res.json(response);
});


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Aldos CloudPRNT server running on port ${PORT}`);
});

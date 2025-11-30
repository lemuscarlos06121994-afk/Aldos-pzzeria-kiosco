// index.js – Aldos pzzeria kiosk CloudPRNT server

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// =============== MIDDLEWARES ==================
app.use(cors());
app.use(bodyParser.json());

// Aquí guardaremos el último ticket que mande el kiosco
let lastTicket = null;

// =============== RUTA DE PRUEBA ==================
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco server is running.");
});

// =============== ENDPOINT /submit ==================
// El kiosco (tu app web) manda aquí el ticket de cocina
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received from kiosk:");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored, printer can fetch it." });
});

// =============== CLOUDPRNT ENDPOINTS ==================
// Estos son los que la impresora Star mC-Print3 va a usar.
// En la impresora debes configurar:
//   Server URL = https://aldos-pzzeria-kiosco.onrender.com/cloudprnt

// 1) La impresora pregunta si hay trabajo
app.get("/cloudprnt/status", (req, res) => {
  if (!lastTicket) {
    return res.json({
      jobReady: false,
      message: "No jobs in queue."
    });
  }

  res.json({
    jobReady: true,
    message: "Job waiting."
  });
});

// 2) La impresora pide el ticket (ESC/POS)
app.get("/cloudprnt/job", (req, res) => {
  if (!lastTicket) {
    return res.json({ jobReady: false });
  }

  const ticketText = lastTicket;

  // Construimos un texto ESC/POS sencillo
  const escpos =
    ticketText +
    "\n-----------------------------\n" +
    "Thank you!\n" +
    "\x1B\x64\x03"; // cortar papel

  const job = {
    jobReady: true,
    job: {
      type: "escpos",
      data: Buffer.from(escpos).toString("base64")
    }
  };

  // Limpiamos el ticket después de entregarlo
  lastTicket = null;

  res.json(job);
});

// =============== ARRANCAR SERVIDOR ==================
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco server listening on port ${PORT}`);
});

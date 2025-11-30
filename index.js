// =========================
// ALDOS PZZERIA – CLOUDPRNT SERVER (FINAL VERSION)
// =========================

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Aquí guardamos el último ticket enviado desde el kiosco
let lastTicket = null;

// ========================
// Ruta de verificación
// ========================
app.get("/", (req, res) => {
  res.send("✅ Aldos Pizzeria CloudPRNT server is running.");
});

// ========================
// El kiosco envía el ticket
// ========================
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  console.log("🧾 Nuevo ticket recibido:");
  console.log(ticket);

  lastTicket = ticket;
  res.json({ ok: true, message: "Ticket stored successfully." });
});

// ===============================
// CLOUDPRNT ENDPOINTS Reales
// ===============================

// 1️⃣ La impresora pregunta si hay trabajo pendiente
app.get("/cloudprnt/status", (req, res) => {
  console.log("📡 Printer requested /cloudprnt/status");

  if (!lastTicket) {
    return res.json({
      jobReady: false,
      mediaTypes: ["application/vnd.star.starprnt"]
    });
  }

  res.json({
    jobReady: true,
    mediaTypes: ["application/vnd.star.starprnt"]
  });
});

// 2️⃣ La impresora pide el trabajo real
app.get("/cloudprnt/job", (req, res) => {
  console.log("📡 Printer requested /cloudprnt/job");

  if (!lastTicket) {
    return res.json({ jobReady: false });
  }

  const ticketText = lastTicket;

  // Convertimos a ESC/POS + corte de papel
  const escpos =
    ticketText +
    "\n-----------------------------\n" +
    "Gracias por su orden!\n" +
    "\x1B\x64\x02"; // Corte de papel

  const job = {
    jobReady: true,
    job: {
      size: escpos.length,
      type: "escpos",
      data: Buffer.from(escpos).toString("base64")
    }
  };

  // Limpiar después de entregar el trabajo
  lastTicket = null;

  res.json(job);
});

// ===============================
// Servidor arrancando
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 CloudPRNT server listening on port ${PORT}`);
});

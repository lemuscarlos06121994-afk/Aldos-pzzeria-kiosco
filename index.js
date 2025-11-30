const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Aquí guardaremos el ticket enviado desde el kiosco
let lastTicket = null;

// PRUEBA: ver si el servidor está vivo
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco server is running.");
});

// El kiosco manda el ticket aquí
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


// ================= CLOUDPRNT ENDPOINTS =================

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

  // Convertimos el ticket a ESC/POS + Base64
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

  // Limpia el ticket después de entregarlo
  lastTicket = null;

  res.json(job);
});


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco server listening on port ${PORT}`);
});

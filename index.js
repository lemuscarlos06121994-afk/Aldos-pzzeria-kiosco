// Aldos-pzzeria-kiosco CloudPRNT backend

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000; // Render te está asignando 10000

app.use(cors());
app.use(bodyParser.json());

// Aquí guardaremos el último ticket que mande el kiosco
let lastTicket = null;

// ================= RUTAS BÁSICAS =================

// Ruta de prueba para ver que el servidor está vivo
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco server is running.");
});

// Endpoint donde el kiosco manda el ticket de cocina
// El kiosco envía:  { "ticket": "TEXTO DEL TICKET..." }
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received from kiosk:");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored successfully." });
});

// ================= CLOUDPRNT ENDPOINTS =================
// La impresora debe llamar a:
//   GET https://aldos-pzzeria-kiosco.onrender.com/cloudprnt/status
//   GET https://aldos-pzzeria-kiosco.onrender.com/cloudprnt/job

// 1) La impresora pregunta si hay trabajo
app.get("/cloudprnt/status", (req, res) => {
  console.log("📡 Printer called /cloudprnt/status");

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

// 2) La impresora pide el ticket (ESC/POS en Base64)
app.get("/cloudprnt/job", (req, res) => {
  console.log("🖨 Printer called /cloudprnt/job");

  if (!lastTicket) {
    return res.json({ jobReady: false });
  }

  const ticketText = lastTicket;

  // Texto ESC/POS simple: ticket + línea + thank you + cortar papel
  const escpos =
    ticketText +
    "\n-----------------------------\n" +
    "Thank you!\n" +
    "\x1B\x64\x03"; // cortar papel (ESC d 3)

  const job = {
    jobReady: true,
    job: {
      type: "escpos",
      data: Buffer.from(escpos, "utf8").toString("base64")
    }
  };

  // Limpia el ticket después de entregarlo
  lastTicket = null;

  res.json(job);
});

// ================= INICIAR SERVIDOR =================
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco server listening on port ${PORT}`);
});

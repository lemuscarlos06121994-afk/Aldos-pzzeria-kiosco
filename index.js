// ================== DEPENDENCIAS BÁSICAS ==================
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Crear app
const app = express();
// Render pone el puerto en process.env.PORT
const PORT = process.env.PORT || 10000;

// ================== MIDDLEWARES ==================
app.use(cors());
app.use(bodyParser.json());

// Aquí guardaremos el último ticket que mande el kiosco
let lastTicket = null;

// ================== RUTA RAÍZ (PRUEBA) ==================
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco server is running.");
});

// ================== ENDPOINT /submit (DESDE EL KIOSCO) ==================
// El frontend (app del kiosco) envía aquí el ticket de cocina
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    console.error("❌ Missing ticket text in /submit");
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received from kiosk:");
  console.log(ticket);

  res.json({
    ok: true,
    message: "Ticket stored, printer can fetch it."
  });
});

// ================== CLOUDPRNT ENDPOINTS (Star mC-Print3) ==================
//
// Configura tu impresora así:
//
//  - Status URL: https://aldos-pzzeria-kiosco.onrender.com/cloudprnt/status
//  - Job URL   : https://aldos-pzzeria-kiosco.onrender.com/cloudprnt/job
//  - Device ID : z2q6dwp2hagm   (ya lo tienes en el papel)
//
// La impresora va a llamar a estos dos endpoints periódicamente.

// 1) La impresora pregunta si hay trabajo
app.get("/cloudprnt/status", (req, res) => {
  console.log("📡 Printer called /cloudprnt/status from", req.ip);

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
  console.log("🖨 Printer called /cloudprnt/job from", req.ip);

  if (!lastTicket) {
    console.log("ℹ️ No ticket available when printer asked /cloudprnt/job");
    return res.json({ jobReady: false });
  }

  const ticketText = lastTicket;

  // Construimos un texto ESC/POS sencillo:
  //  - ticket
  //  - línea de separación
  //  - "Thank you!"
  //  - comando de cortar papel (ESC d 3)
  const escpos =
    ticketText +
    "\n-----------------------------\n" +
    "Thank you!\n" +
    "\x1B\x64\x03";

  const job = {
    jobReady: true,
    job: {
      type: "escpos",
      data: Buffer.from(escpos).toString("base64")
    }
  };

  // Limpiamos el ticket después de entregarlo
  lastTicket = null;

  console.log("✅ Job sent to printer (CloudPRNT).");
  res.json(job);
});

// ================== 404 POR DEFECTO ==================
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ================== INICIAR SERVIDOR ==================
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco server listening on port ${PORT}`);
  console.log("✅ Your service is live 🎉");
});

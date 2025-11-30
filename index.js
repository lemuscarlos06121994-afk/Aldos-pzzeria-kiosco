// index.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ====== MIDDLEWARES ======
app.use(cors());
app.use(bodyParser.json());

// Aquí guardamos el último ticket que mandó el kiosco
let lastTicket = null;

// ====== RUTA DE PRUEBA (HEALTHCHECK) ======
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco server is running.");
});

// ====== ENDPOINT DONDE EL KIOSCO MANDA EL TICKET ======
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket || typeof ticket !== "string") {
    console.log("❌ /submit llamado con body inválido:", req.body);
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received from kiosk:");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored successfully." });
});

// ====== CLOUDPRNT: STATUS ======
// La impresora llama aquí cada 15s para preguntar si hay trabajo
app.get("/cloudprnt/status", (req, res) => {
  const ready = !!lastTicket;
  console.log("📡 Printer called /cloudprnt/status – jobReady =", ready);

  return res.json({
    jobReady: ready,        // true si hay ticket, false si no
    mediaTypes: ["escpos"], // tipo de trabajo que enviamos
    deleteJob: true         // que borre el job cuando lo tome
  });
});

// ====== CLOUDPRNT: JOB ======
// Cuando jobReady = true, la impresora llama aquí para pedir el ticket
app.get("/cloudprnt/job", (req, res) => {
  if (!lastTicket) {
    console.log("📄 Printer called /cloudprnt/job but there is no ticket.");
    return res.json({ jobReady: false });
  }

  const ticketText = lastTicket;
  console.log("🖨️ Printer called /cloudprnt/job – sending ticket.");
  // limpiamos el ticket para que solo se imprima una vez
  lastTicket = null;

  // Construimos texto ESC/POS
  const escpos =
    ticketText +
    "\n-----------------------------\n" +
    "Thank you!\n" +
    "\x1B\x64\x03"; // cortar papel

  // Lo convertimos a Base64 como pide CloudPRNT
  res.json({
    jobReady: true,
    job: {
      type: "escpos",
      data: Buffer.from(escpos, "utf8").toString("base64")
    }
  });
});

// ====== INICIAR SERVIDOR ======
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco server listening on port ${PORT}`);
});

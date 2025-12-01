const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let lastTicket = null;

// =============================
// Estado del servidor
// =============================
app.get("/", (req, res) => {
  res.send("✅ Aldos CloudPRNT server running.");
});

// =============================
// Recibir ticket desde el kiosco
// =============================
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;

  console.log("\n🧾 New ticket received from kiosk:");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored successfully." });
});

// ==========================================================
//            CLOUDPRNT MODERNO (StarPRNT REQUIRED)
// ==========================================================

// 1) Estado: la impresora pregunta por trabajo (POST)
app.post("/cloudprnt/status", (req, res) => {
  const response = {
    jobReady: !!lastTicket,
    mediaTypes: ["starprnt"],
    deleteJob: true
  };

  console.log("🖨️ Printer called /cloudprnt/status →", response);
  res.json(response);
});

// 2) La impresora pide el ticket (POST)
app.post("/cloudprnt/job", (req, res) => {
  if (!lastTicket) {
    return res.json({ jobReady: false });
  }

  const rawText = lastTicket + "\n-----------------------------\nGracias!\n\n";

  // Comandos STARPRNT (NO ESC/POS)
  const starPRNTCommand =
    '\x1b\x1d\x61\x01' +  // Center text
    rawText +
    '\x1b\x64\x02';       // Partial cut

  const job = {
    jobReady: true,
    job: {
      type: "starprnt",
      data: Buffer.from(starPRNTCommand).toString("base64")
    }
  };

  console.log("📨 Sending job to printer (starprnt, base64). Size:", starPRNTCommand.length);

  // limpiar el ticket después de entregarlo
  lastTicket = null;

  res.json(job);
});

// =============================
// Iniciar servidor
// =============================
app.listen(PORT, () => {
  console.log(`🚀 CloudPRNT server running on port ${PORT}`);
});

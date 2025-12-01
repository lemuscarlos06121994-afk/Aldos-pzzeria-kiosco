// =========================
//  Aldos CloudPRNT server
// =========================

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
// En Render ya tienes PORT=10000 configurado, aquí lo respetamos:
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// Último ticket que manda el kiosco (texto plano)
let lastTicket = null;

// -------------------------
//  RUTA RAÍZ (prueba)
// -------------------------
app.get("/", (req, res) => {
  res.send("✅ Aldos CloudPRNT server is running.");
});

// -------------------------------------
//  /submit  ->  la web del kiosco
//  manda aquí el ticket de cocina
// -------------------------------------
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    console.log("⚠️ /submit called without 'ticket' field");
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received from kiosk:");
  console.log(ticket);

  return res.json({
    ok: true,
    message: "Ticket stored successfully."
  });
});

// ==========================================
//  /cloudprnt  ->  la impresora mC-Print3
//  llama aquí cada X segundos (POST)
// ==========================================
app.post("/cloudprnt", (req, res) => {
  console.log("🖨️ Printer called /cloudprnt (POST)");
  console.log("   Body from printer:", JSON.stringify(req.body || {}, null, 2));

  // Si NO hay ticket guardado, contestamos que no hay trabajo.
  if (!lastTicket) {
    console.log("ℹ️ No ticket in queue. Replying jobReady:false");
    return res.json({
      jobReady: false,
      deleteJob: false
    });
  }

  // Guardamos y limpiamos la cola (un solo ticket a la vez)
  const ticketText = lastTicket;
  lastTicket = null;

  // -----------------------------
  //  Construir ESC/POS
  // -----------------------------
  // 1. Inicializar impresora
  const init = Buffer.from([0x1b, 0x40]); // ESC @

  // 2. Texto del ticket (UTF-8 → bytes)
  const textBuf = Buffer.from(ticketText + "\n-----------------------------\nTHANK YOU!\n\n", "utf8");

  // 3. Comando de corte de papel (ESC/POS)
  //    Aquí usamos "ESC d 3" (alimentar y cortar)
  const cut = Buffer.from([0x1b, 0x64, 0x03]);

  // 4. Juntamos todo
  const fullJobBuf = Buffer.concat([init, textBuf, cut]);

  // 5. Lo convertimos a base64 para CloudPRNT
  const jobDataBase64 = fullJobBuf.toString("base64");

  // -----------------------------
  //  Respuesta CloudPRNT
  // -----------------------------
  const responsePayload = {
    jobReady: true,          // hay trabajo
    deleteJob: true,         // borra el job de la cola después
    mediaTypes: ["escpos"],  // tipo de datos que mandamos
    jobs: [
      {
        id: Date.now().toString(), // id único simple
        type: "escpos",
        data: jobDataBase64
      }
    ]
  };

  console.log("➡️ Sending job to printer (escpos, base64). Size:", fullJobBuf.length, "bytes");

  return res.json(responsePayload);
});

// -------------------------
//  Iniciar servidor
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 CloudPRNT server running on port ${PORT}`);
});

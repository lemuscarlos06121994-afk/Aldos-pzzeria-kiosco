// =============================
// ALDOS KIOSCO CLOUDPRNT SERVER
// =============================

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
// Render pone el puerto en process.env.PORT (normalmente 10000)
const PORT = process.env.PORT || 3000;

// ----------- MIDDLEWARES -----------
app.use(cors());
app.use(bodyParser.json());

// Aquí guardamos el último ticket que envía el kiosco
let lastTicket = null;

// ----------- RUTA RAÍZ (SALUD) -----------
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco server is running.");
});

// ----------- ENDPOINT /submit (KIOSCO -> SERVIDOR) -----------
// El kiosco (tu página del menú) manda aquí el ticket en formato texto.
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    console.error("❌ /submit: Missing ticket text in body");
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received from kiosk:");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored, printer can fetch it." });
});

// ================= CLOUDPRNT ENDPOINTS (Star mC-Print3) =================
// IMPORTANTE:
// En la impresora, el "CloudPRNT Server URL" debe apuntar a:
//   https://aldos-pzzeria-kiosco.onrender.com/cloudprnt
// La impresora sola le agrega /status y /job.

// Helper: construye texto ESC/POS para la impresora
function buildEscPos(ticketText) {
  const ESC = "\x1B";
  const GS  = "\x1D";

  let out = "";
  out += ESC + "@";          // Reset
  out += ESC + "!" + "\x38"; // Título grande
  out += "ALDO'S PIZZERIA\n";
  out += ESC + "!" + "\x00"; // Tamaño normal
  out += "-----------------------------\n";
  out += ticketText + "\n";
  out += "-----------------------------\n";
  out += "Thank you!\n";
  out += ESC + "d" + "\x03"; // Avanza 3 líneas
  out += GS + "V" + "\x00";  // Corte completo
  return out;
}

// 1) La impresora pregunta si hay trabajo
// Usamos ALL para aceptar GET o POST, según cómo la impresora llame.
app.all("/cloudprnt/status", (req, res) => {
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

// 2) La impresora pide el ticket (ESC/POS)
app.all("/cloudprnt/job", (req, res) => {
  console.log("📡 Printer called /cloudprnt/job");

  if (!lastTicket) {
    console.log("ℹ️ No ticket available for printer.");
    return res.json({ jobReady: false });
  }

  const ticketText = lastTicket;
  const escpos = buildEscPos(ticketText);

  const job = {
    jobReady: true,
    job: {
      type: "escpos",
      data: Buffer.from(escpos, "binary").toString("base64")
    }
  };

  // limpiamos el ticket después de enviarlo
  lastTicket = null;

  console.log("📨 Ticket sent to printer (CloudPRNT).");
  res.json(job);
});

// ----------- INICIAR SERVIDOR -----------
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco server listening on port ${PORT}`);
  console.log("Primary URL:", `https://aldos-pzzeria-kiosco.onrender.com`);
});

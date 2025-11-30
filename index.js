// ================== DEPENDENCIAS BÁSICAS ==================
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
// Render pone el puerto en process.env.PORT (normalmente 10000)
const PORT = process.env.PORT || 3000;

// ================== MIDDLEWARES ==================
app.use(cors());
app.use(bodyParser.json());

// Aquí guardaremos el ÚLTIMO ticket que mandó el kiosco
let lastTicket = null;

// ================== RUTA RAÍZ (PRUEBA) ==================
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco server is running.");
});

// ================== ENDPOINT /submit (desde el KIOSCO) ==================
// El kiosco (tu página de menú) envía el ticket de texto aquí
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    console.log("⚠️ /submit llamado SIN ticket");
    return res.status(400).json({ error: "Missing ticket text" });
  }

  // Guardamos el ticket en memoria
  lastTicket = ticket;

  console.log("🧾 New ticket received from kiosk:");
  console.log("----------------------------------");
  console.log(ticket);
  console.log("----------------------------------");

  res.json({ ok: true, message: "Ticket stored, printer can fetch it." });
});

// ================== CLOUDPRNT ENDPOINTS ==================
// Vamos a soportar tres rutas por si la impresora usa
// /cloudprnt, /cloudprnt/status o /cloudprnt/job

// Función común para LOG
function logRequest(path, req) {
  console.log(`🖨️ Printer called ${path} from ${req.ip || "unknown IP"}`);
}

// ---------- 1) STATUS: ¿hay trabajo? ----------
function cloudprntStatusHandler(req, res) {
  logRequest("/cloudprnt/status", req);

  if (!lastTicket) {
    return res.json({
      jobReady: false,
      message: "No jobs in queue."
    });
  }

  return res.json({
    jobReady: true,
    message: "Job waiting."
  });
}

// ---------- 2) JOB: dame el ticket ----------
function cloudprntJobHandler(req, res) {
  logRequest("/cloudprnt/job", req);

  if (!lastTicket) {
    return res.json({ jobReady: false });
  }

  const ticketText = lastTicket;

  // Construimos un texto ESC/POS simple:
  // \x1B\x40 -> init
  // \x1B\x64\x03 -> feed 3 líneas y cortar
  const escpos =
    "\x1B\x40" + // inicializar impresora
    ticketText +
    "\n-----------------------------\n" +
    "Thank you!\n" +
    "\x1B\x64\x03"; // feed + cut

  const job = {
    jobReady: true,
    job: {
      type: "escpos",
      data: Buffer.from(escpos, "utf8").toString("base64")
    }
  };

  console.log("📨 Enviando JOB a la impresora (CloudPRNT)...");

  // Limpiamos el ticket para no imprimirlo dos veces
  lastTicket = null;

  return res.json(job);
}

// ---------- RUTA ÚNICA /cloudprnt (para impresoras que usan solo 1 URL) ----------
app.get("/cloudprnt", (req, res) => {
  // Si hay ticket pendiente, devolvemos el JOB directamente
  if (lastTicket) {
    return cloudprntJobHandler(req, res);
  }
  // Si no hay ticket, solo status
  return cloudprntStatusHandler(req, res);
});

// ---------- RUTAS EXPLÍCITAS /cloudprnt/status y /cloudprnt/job ----------
app.get("/cloudprnt/status", cloudprntStatusHandler);
app.get("/cloudprnt/job", cloudprntJobHandler);

// ================== INICIAR SERVIDOR ==================
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco server listening on port ${PORT}`);
});

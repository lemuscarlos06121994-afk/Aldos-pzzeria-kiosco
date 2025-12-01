// index.js - Aldos kiosco + Star CloudPRNT (mC-Print3)

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000; // Render suele usarse con 10000; pero respeta process.env.PORT

// ====== MIDDLEWARES ======
app.use(cors());
app.use(bodyParser.json());

// Último ticket recibido desde el kiosco
let lastTicket = null;

// ====== RUTA RAÍZ ======
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco CloudPRNT server is running.");
});

// ====== ENDPOINT /submit (lo llama tu app de menú / kiosco) ======
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket || typeof ticket !== "string") {
    return res.status(400).json({ ok: false, error: "Missing ticket text" });
  }

  lastTicket = ticket;

  console.log("🧾 New ticket received from kiosk:");
  console.log(ticket);

  return res.json({
    ok: true,
    message: "Ticket stored successfully."
  });
});

// ====== CLOUDPRNT ENDPOINTS PARA LA mC-PRINT3 ======
//
// IMPORTANTE:
// En la impresora pusiste:
//   Server URL: https://aldos-pzzeria-kiosco.onrender.com/cloudprnt
//
// Star va a llamar:
//   GET /cloudprnt          -> status y capabilities
//   POST /cloudprnt         -> job data / ACK (dependiendo del modelo)
//
// Para simplificar: respondemos siempre con el mismo JSON.

// 1) La impresora pregunta si hay trabajo (status + capabilities)
app.get("/cloudprnt", (req, res) => {
  // Sólo para ver que la impresora pregunta:
  console.log("📡 Printer called /cloudprnt (GET)");

  // Si NO hay ticket guardado
  if (!lastTicket) {
    return res.json({
      jobReady: false,
      mediaTypes: ["escpos"],
      deleteJob: false
    });
  }

  // Si SÍ hay ticket guardado
  return res.json({
    jobReady: true,
    // le decimos que soportamos ESC/POS
    mediaTypes: ["escpos"],
    deleteJob: false
  });
});

// 2) La impresora viene por el trabajo (POST /cloudprnt)
app.post("/cloudprnt", (req, res) => {
  console.log("🖨 Printer called /cloudprnt (POST)");

  if (!lastTicket) {
    // Nada que imprimir
    return res.json({
      jobReady: false,
      mediaTypes: ["escpos"],
      deleteJob: false
    });
  }

  const ticketText = lastTicket;

  // ===== CONVERTIR TICKET A ESC/POS SIMPLE =====
  // Aquí estamos usando el texto tal cual, con saltos de línea y al final
  // mandamos "cortar papel".
  const escpos =
    ticketText +
    "\n------------------------------\n" +
    "Thank you!\n" +
    "\x1B\x64\x03"; // ESC d n -> feed & cut

  const job = {
    jobReady: true,
    mediaTypes: ["escpos"],
    deleteJob: true, // después de imprimir, que lo borre
    // algunos modelos esperan 'job', otros 'data' directamente; este patrón
    // funciona con la mayoría de CloudPRNT mC-Print3:
    data: Buffer.from(escpos, "utf8").toString("base64"),
    type: "escpos"
  };

  // Limpiamos el ticket para que no se imprima dos veces
  lastTicket = null;

  console.log("📦 Sending job to printer (escpos, base64).");

  return res.json(job);
});

// ====== INICIAR SERVIDOR ======
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco CloudPRNT server listening on port ${PORT}`);
});

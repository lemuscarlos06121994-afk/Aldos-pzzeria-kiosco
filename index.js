// index.js – Servidor CloudPRNT para Aldos kiosco (mC-Print3)

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000; // Render ya te está poniendo 10000

app.use(cors());
app.use(bodyParser.json());

// Último ticket recibido del kiosco (texto plano)
let lastTicket = null;

// ================== RUTA DE PRUEBA ==================
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco CloudPRNT server is running.");
});

// =============== ENDPOINT DESDE EL KIOSCO ===============
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received from kiosk:");
  console.log(ticket);

  return res.json({ ok: true, message: "Ticket stored successfully." });
});

// =============== CLOUDPRNT (STAR mC-PRINT3) ===============
//
// Tu impresora está llamando a /cloudprnt con método POST.
// Vamos a responderle en este mismo endpoint.
//
// 1) La impresora POSTea su estado.
// 2) Nosotros respondemos con un JSON que incluye el trabajo escpos/base64.
//
app.post("/cloudprnt", (req, res) => {
  console.log("🖨️ Printer called /cloudprnt (POST)");

  // Imprime el cuerpo que manda la impresora (para debug)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body from printer:", JSON.stringify(req.body, null, 2));
  }

  // Si NO hay ticket pendiente, indicamos que no hay trabajo
  if (!lastTicket) {
    return res.json({
      jobReady: false,
      deleteJob: false,
      mediaTypes: ["escpos"]
    });
  }

  // -------- Construimos ESC/POS sencillo --------
  const ESC = "\x1B";
  const GS = "\x1D";

  // Inicializar impresora
  let escpos = "";
  escpos += ESC + "@"; // inicializar

  // Texto del ticket (tal cual viene del kiosco)
  escpos += lastTicket + "\n";

  // Línea de separación
  escpos += "------------------------------\n";
  escpos += "Thank you!\n";

  // Avanzar papel y cortar
  escpos += ESC + "d" + "\x03"; // feed 3 líneas
  escpos += GS + "V" + "\x00";  // corte completo

  // Convertir a base64
  const base64Data = Buffer.from(escpos, "binary").toString("base64");

  // IMPORTANTE: una vez que mandamos el job, limpiamos lastTicket
  const ticketPreview = lastTicket;
  lastTicket = null;

  console.log(
    `📦 Sending job to printer (escpos, base64). Size: ${base64Data.length} bytes`
  );
  console.log("Ticket preview:\n" + ticketPreview);

  // Respuesta CloudPRNT
  return res.json({
    jobReady: true,
    mediaTypes: ["escpos"],
    deleteJob: true,
    job: {
      type: "escpos",
      data: base64Data
    }
  });
});

// =============== INICIAR SERVIDOR ===============
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco CloudPRNT server running on port ${PORT}`);
});

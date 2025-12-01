// ================== DEPENDENCIAS BÁSICAS ==================
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
// Render usa process.env.PORT (normalmente 10000)
const PORT = process.env.PORT || 10000;

// ================== MIDDLEWARES ==================
app.use(cors());
app.use(bodyParser.json());

// Aquí guardamos el ÚLTIMO ticket que mande el kiosco
let lastTicket = null;

// ================== RUTA RAÍZ ==================
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco CloudPRNT server is running.");
});

// ================== /submit (KIOSCO → SERVIDOR) ==================
//
// El kiosco (tu app del menú) envía aquí el texto del ticket.
// Ejemplo de body: { "ticket": "PRUEBA DESDE KIOSCO\n1 pizza..." }
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    console.error("❌ /submit called without ticket text");
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received from kiosk:");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored successfully." });
});

// ================== /cloudprnt (IMPRESORA → SERVIDOR) ==================
//
// La mC-Print3 hace POST a esta ruta cada 15 segundos.
// En el body manda su status. Nosotros respondemos con el job
// cuando haya un ticket pendiente.
//
app.post("/cloudprnt", (req, res) => {
  console.log("🖨️ Printer called /cloudprnt (POST)");

  // Solo para depurar: ver lo que manda la impresora
  try {
    console.log("Body from printer:", JSON.stringify(req.body, null, 2));
  } catch (e) {
    console.log("Body from printer (raw):", req.body);
  }

  // Si NO hay ticket pendiente → nada que imprimir
  if (!lastTicket) {
    console.log("➡️ No job in queue. Responding jobReady:false");
    return res.json({
      jobReady: false,
      deleteJob: false,
      mediaTypes: ["starprnt"]
    });
  }

  // Si SÍ hay ticket pendiente → preparar job
  const ticketText = lastTicket;

  // IMPORTANTE:
  // Para starprnt podemos mandar texto plano.
  // Añadimos unos saltos de línea al final para que avance el papel.
  const rawData = ticketText + "\n\n\n";

  // Convertimos a Base64
  const base64Data = Buffer.from(rawData, "utf8").toString("base64");
  console.log(
    `📤 Sending job to printer (starprnt, base64). Size: ${base64Data.length} bytes`
  );

  // Borramos el ticket de la cola (solo se imprime una vez)
  lastTicket = null;

  // Respuesta en formato CloudPRNT (starprnt)
  // La impresora descargará este job e intentará imprimirlo
  return res.json({
    jobReady: true,
    deleteJob: true,
    mediaTypes: ["starprnt"],
    job: {
      type: "starprnt", // Tipo de datos
      data: base64Data  // Contenido en Base64
    }
  });
});

// ================== /cloudprnt/status (SOLO PARA PRUEBAS EN NAVEGADOR) ==================
//
// Si abres esta URL desde el navegador solo para ver el estado:
// https://aldos-pzzeria-kiosco.onrender.com/cloudprnt/status
// NO la usa la impresora, es solo para ti.
app.get("/cloudprnt/status", (req, res) => {
  res.json({
    jobReady: !!lastTicket,
    deleteJob: true,
    mediaTypes: ["starprnt"]
  });
});

// ================== INICIAR SERVIDOR ==================
app.listen(PORT, () => {
  console.log(`🚀 CloudPRNT server running on port ${PORT}`);
});

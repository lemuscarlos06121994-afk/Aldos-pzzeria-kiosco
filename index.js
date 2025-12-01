const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Aquí guardamos el último ticket recibido del kiosco
let lastTicket = null;

// VERIFICAR QUE EL SERVIDOR ESTÁ VIVO
app.get("/", (req, res) => {
  res.send("✅ Aldos Pizzeria CloudPRNT server is running.");
});

// EL KIOSCO ENVÍA SU TICKET AQUÍ
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;

  console.log("🧾 Nuevo ticket recibido:");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored successfully." });
});

/* ============================================================
   🌐 CLOUDPRNT PARA MCP30 (versión antigua)
   La impresora consulta SOLO /cloudprnt y /cloudprnt/job
   ============================================================*/

// 1️⃣ La impresora pregunta el estado aquí:
app.get("/cloudprnt", (req, res) => {
  if (!lastTicket) {
    return res.json({
      jobReady: false,
      message: "No job in queue"
    });
  }

  res.json({
    jobReady: true,
    mediaTypes: ["escpos"],  // necesario
    deleteJob: true          // borrar ticket después
  });
});

// 2️⃣ La impresora pide el trabajo aquí:
app.get("/cloudprnt/job", (req, res) => {
  if (!lastTicket) {
    return res.json({
      jobReady: false
    });
  }

  const escpos =
    lastTicket +
    "\n-----------------------------\n" +
    "Gracias por su compra!\n" +
    "\x1B\x64\x03"; // cortar papel

  const job = {
    jobReady: true,
    job: Buffer.from(escpos).toString("base64")
  };

  // limpiar ticket después de entregarlo
  lastTicket = null;

  res.json(job);
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log(`🚀 CloudPRNT server running on port ${PORT}`);
});
  

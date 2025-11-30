const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Aquí guardaremos el último ticket que mande el kiosco
let lastTicket = null;

// Ruta de prueba para ver que el servidor está vivo
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco server is running.");
});

// Endpoint donde el kiosco manda el ticket de cocina
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received from kiosk:");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored, printer can fetch it." });
});

// (Más adelante aquí podemos agregar /cloudprnt para la impresora)
// app.get("/cloudprnt", ...);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco server listening on port ${PORT}`);
});

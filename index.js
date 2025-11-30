// index.js  — Aldos Pzzeria Kiosco (CloudPRNT server)

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

// ====== RUTA PRINCIPAL (para probar que el server vive) ======
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco server is running.");
});

// ====== ENDPOINT DONDE EL KIOSCO ENVÍA EL TICKET ======
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received from kiosk:\n");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored, printer can fetch it." });
});

// ====== ENDPOINT CLOUDPRNT PARA LA IMPRESORA ======
// La impresora Star mC-Print3 hará peticiones GET a esta ruta.
// URL para poner en la impresora:
//   https://aldos-pzzeria-kiosco.onrender.com/cloudprnt
app.get("/cloudprnt", (req, res) => {
  // Si no hay ticket pendiente, avisamos que no hay trabajo
  if (!lastTicket) {
    return res.json({
      jobReady: false,
      message: "No jobs in queue."
    });
  }

  const ESC = "\x1B";
  const GS = "\x1D";

  // Construimos un texto ESC/POS simple
  const escpos =
    ESC + "@"+                           // reset
    ESC + "!" + "\x38" +                 // doble ancho + doble alto (negrita)
    "ALDO'S PIZZERIA\n" +
    ESC + "!" + "\x00" +                 // fuente normal
    "------------------------------\n" +
    lastTicket + "\n" +
    "------------------------------\n" +
    "Thank you!\n" +
    ESC + "d" + "\x03" +                 // feed 3 líneas
    GS + "V" + "\x00";                   // cortar papel

  // limpiamos el ticket para que no se repita
  lastTicket = null;

  // Respondemos en formato CloudPRNT
  res.json({
    jobReady: true,
    job: {
      type: "escpos",
      data: Buffer.from(escpos).toString("base64")
    }
  });
});

// ====== INICIAR SERVIDOR ======
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco server listening on port ${PORT}`);
});

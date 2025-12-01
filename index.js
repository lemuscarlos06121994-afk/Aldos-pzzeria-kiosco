const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let lastTicket = null;

// Prueba servidor
app.get("/", (req, res) => {
  res.send("✅ Aldos CloudPRNT server running.");
});

// El kiosco manda un ticket
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;
  console.log("🧾 New ticket received from kiosk:");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored successfully." });
});

/* ============================================================
     CLOUDPRNT PARA STAR mC-PRINT3  (STARPRNT MODE)
   ============================================================ */

// La impresora pregunta si hay trabajo
app.get("/cloudprnt/status", (req, res) => {
  const jobReady = !!lastTicket;

  res.json({
    jobReady,
    mediaTypes: ["starprnt"],
    deleteJob: true
  });
});

// La impresora pide el trabajo
app.post("/cloudprnt", (req, res) => {
  console.log("🖨️ Printer called /cloudprnt (POST)");

  if (!lastTicket) {
    return res.json({ jobReady: false });
  }

  const ticketText = lastTicket;

  // Formato STARPRNT (NO ESC/POS)
  const starprnt =
    ticketText +
    "\n-----------------------------\n" +
    "Gracias por su orden\n" +
    "\n\r\n\r\n\r"; // FEED + CUT automático de StarPRNT

  const job = {
    jobReady: true,
    job: {
      type: "starprnt",
      format: "base64",
      data: Buffer.from(starprnt).toString("base64")
    }
  };

  console.log("🖨️ Sending job to printer (starprnt, base64)");

  lastTicket = null;
  res.json(job);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 CloudPRNT server running on port ${PORT}`);
});

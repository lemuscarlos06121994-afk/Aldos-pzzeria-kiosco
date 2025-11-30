const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let lastTicket = null;

// ======================= TEST ROUTE =======================
app.get("/", (req, res) => {
  res.send("✅ Aldos Kiosco CloudPRNT server is running.");
});

// ======================= SUBMIT FROM KIOSK =======================
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;

  console.log("🧾 New ticket received from kiosk:");
  console.log(lastTicket);

  res.json({ ok: true, message: "Ticket stored. Printer will fetch it." });
});

// ======================= MAIN CLOUDPRNT ENDPOINT =======================
// La impresora SOLO llama a ESTA ruta:
app.get("/cloudprnt", (req, res) => {

  // Si NO hay ticket → impresora espera
  if (!lastTicket) {
    return res.json({
      jobReady: false,
      mediaTypes: ["text/plain"]
    });
  }

  // Si hay ticket → generar job ESC/POS en BASE64
  console.log("📤 Printer is requesting job… sending ticket!");

  const escpos =
    lastTicket +
    "\n-----------------------------\n" +
    "Gracias!\n" +
    "\x1B\x64\x03"; // cortar papel

  const base64Data = Buffer.from(escpos).toString("base64");

  // Formato oficial CloudPRNT
  const job = {
    jobReady: true,
    mediaTypes: ["text/plain"],
    job: {
      type: "escpos",
      data: base64Data
    }
  };

  // Borrar ticket después de entregarlo
  lastTicket = null;

  res.json(job);
});

// ======================= START SERVER =======================
app.listen(PORT, () => {
  console.log(`🚀 Aldos Kiosco CloudPRNT server running on port ${PORT}`);
});

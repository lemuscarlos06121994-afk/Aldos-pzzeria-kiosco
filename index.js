const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// almacenamiento temporal del ticket
let lastTicket = null;

// Home
app.get("/", (req, res) => {
  res.send("✅ Aldos kiosco server is running.");
});

// KIOSKO ENVÍA TICKET AQUÍ
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastTicket = ticket;

  console.log("🧾 Ticket received from kiosk:");
  console.log(ticket);

  res.json({ ok: true, message: "Ticket stored, printer will fetch it." });
});

// ===============================
//   CLOUDPRNT STATUS ENDPOINT
// ===============================
app.get("/cloudprnt/status", (req, res) => {
  if (!lastTicket) {
    return res.json({
      jobReady: false,
      message: "No job in queue."
    });
  }

  res.json({
    jobReady: true,
    message: "Job waiting."
  });
});

// ===============================
//   CLOUDPRNT JOB ENDPOINT
// ===============================
app.get("/cloudprnt/job", (req, res) => {
  if (!lastTicket) {
    return res.json({ jobReady: false });
  }

  // convertir el ticket a Base64 (formato requerido)
  const job = {
    jobReady: true,
    job: {
      type: "text",
      data: Buffer.from(lastTicket).toString("base64")
    }
  };

  // limpiar cola
  lastTicket = null;

  res.json(job);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Aldos kiosco server listening on port ${PORT}`);
});

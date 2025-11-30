const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let lastOrder = null;

// 👉 Endpoint donde la impresora pregunta si hay trabajo
app.get("/cloudprnt", (req, res) => {
  if (!lastOrder) {
    return res.json({
      jobReady: false
    });
  }

  const ESC = "\x1B";
  const GS = "\x1D";

  const escpos =
    ESC + "@"
    + ESC + "!" + "\x38"
    + "ALDO'S PIZZERIA\n"
    + "---------------------------\n"
    + lastOrder + "\n"
    + "---------------------------\n"
    + "Thank you!\n"
    + ESC + "d" + "\x03"
    + GS + "V" + "\x00";

  // limpiamos el último ticket después de enviarlo
  lastOrder = null;

  res.json({
    jobReady: true,
    job: {
      type: "escpos",
      data: Buffer.from(escpos).toString("base64")
    }
  });
});

// 👉 Endpoint donde TU KIOSCO manda el texto del ticket
app.post("/submit", (req, res) => {
  const { ticket } = req.body || {};

  if (!ticket) {
    return res.status(400).json({ error: "Missing ticket text" });
  }

  lastOrder = ticket;

  console.log("✅ Ticket received from kiosk:");
  console.log(ticket);

  res.json({
    success: true,
    message: "Ticket stored, printer will fetch it."
  });
});

// 👉 Mensaje de prueba en la raíz
app.get("/", (req, res) => {
  res.send("✅ Aldo's CloudPRNT server is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Aldo's CloudPRNT server listening on port ${PORT}`);
});

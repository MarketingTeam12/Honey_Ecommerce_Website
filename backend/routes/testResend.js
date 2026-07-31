const express = require("express");
const router = express.Router();
const resend = require("../utils/resend");

router.get("/test-resend", async (req, res) => {
  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "honeytranslations.tech1@gmail.com",
      subject: "Resend Test",
      html: "<h2>Mail sent successfully from Resend</h2>",
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

module.exports = router;
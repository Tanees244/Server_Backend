const express = require("express");
const router = express.Router();
const pool = require("./Db/db");

router.get("/places", (req, res) => {
  pool.query("SELECT * from places", (error, results, fields) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }

    // Convert image data to base64
    results.forEach(place => {
      place.image = Buffer.from(place.image).toString('base64');
    });

    res.json(results);
  });
});

router.get("/packages", (req, res) => {
  pool.query("SELECT * from packages", (error, results, feilds) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }
    res.json(results);
  });
});

router.get("/package-details", (req, res) => {
  const userId = req.body;

  const query = `
        SELECT
            p1.destination,
            p1.preferences,
            g.guide_id,
            cr.car_name
        FROM package_details p
        LEFT JOIN packages p1 ON p.package_id = p1.package_id
        LEFT JOIN guides g ON p.guide_id = g.guide_id
        LEFT JOIN car_rental_service cr ON p.car_rental_id = cr.car_rental_id
        WHERE p.package_detail_id = ?
    `;

  pool.query(query, [userId], (error, results) => {
    if (error) {
      console.error("Error fetching data:", error);
      return res.status(500).json({ error: "Error fetching data" });
    }
    res.status(200).json(results);
  });
});



module.exports = router;

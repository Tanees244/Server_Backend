const express = require("express");
const AdminRoutes = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("./Db/db");
const jwt = require("jsonwebtoken");

AdminRoutes.get("/tourist_details", (req, res) => {
  pool.query("SELECT * from places", (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }
    results.forEach(place => {
      place.image = Buffer.from(place.image).toString('base64');
    });

    res.json(results);
  });
});

AdminRoutes.delete("/guide/:id", (req, res) => {
  const guideId = req.params.id;
  pool.query(
    "UPDATE guide_application SET status = 'rejected' WHERE guide_id = ?",
    [guideId],
    (error, results) => {
      if (error) {
        console.error("Error rejecting guide:", error);
        res.status(500).send("Error rejecting guide");
        return;
      }
      console.log("Guide rejected successfully");
      res.sendStatus(204); 
    }
  );
});

AdminRoutes.get("/guide-details", (req, res) => {
  pool.query(`
    SELECT gp.guide_id, gp.name, ga.status, p.package_id, p.destination, p.preferences, p.price
    FROM guide_personal_details gp
    JOIN guide_application ga ON gp.guide_id = ga.guide_id
    LEFT JOIN guide_operations go ON gp.guide_id = go.guide_id
    LEFT JOIN packages p ON go.package_id = p.package_id
    WHERE ga.status = 'active'
  `, (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }

    console.log("Query results:", results);

    res.json(results);
  });
});

AdminRoutes.get("/tourist-details", (req, res) => {
  const query = `
    SELECT td.name AS name, bp.tourist_id, p.package_id, p.destination, p.preferences, p.price, p.rating
    FROM tourist_details td
    INNER JOIN booked_packages bp ON td.tourist_id = bp.tourist_id
    LEFT JOIN packages p ON bp.package_id = p.package_id
  `;

  pool.query(query, (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }

    console.log("Tourist Details Query results:", results);
    res.json(results);
  });
});


module.exports = AdminRoutes;
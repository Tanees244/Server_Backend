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

module.exports = AdminRoutes;
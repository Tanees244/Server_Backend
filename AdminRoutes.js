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

AdminRoutes.get("/hotel_details", (req, res) => {
  pool.query("SELECT * FROM hotel_details", (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching hotel details");
      return;
    }
    res.json(results);
  });
});

AdminRoutes.get("/airline_details", (req, res) => {
  pool.query("SELECT * FROM airline_details", (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching airline details");
      return;
    }
    res.json(results);
  });
});

AdminRoutes.get("/railway_details", (req, res) => {
  pool.query("SELECT * FROM railway_details", (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching railway details");
      return;
    }
    res.json(results);
  });
});

AdminRoutes.get("/bus_details", (req, res) => {
  pool.query("SELECT * FROM bus_details", (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching bus details");
      return;
    }
    res.json(results);
  });
});


AdminRoutes.delete("/vendor/:airlineId", (req, res) => {
  const airlineId = req.params.airlineId;

  pool.query(
      `DELETE FROM airline_packages WHERE airline_details_id IN (SELECT airline_details_id FROM airline_details WHERE airline_id = ?)`,
      [airlineId],
      (err) => {
          if (err) {
              console.error("Error executing query:", err);
              res.status(500).send("Error deleting records");
              return;
          }

          pool.query(
              `DELETE FROM airline_details WHERE airline_id = ?`,
              [airlineId],
              (err) => {
                  if (err) {
                      console.error("Error executing query:", err);
                      res.status(500).send("Error deleting records");
                      return;
                  }

                  pool.query(
                      `SELECT transport_id FROM airline_transport WHERE airline_id = ?`,
                      [airlineId],
                      (err, transportResult) => {
                          if (err) {
                              console.error("Error executing query:", err);
                              res.status(500).send("Error deleting records");
                              return;
                          }

                          if (transportResult.length > 0) {
                              const transportId = transportResult[0].transport_id;

                              pool.query(
                                  `DELETE FROM airline_transport WHERE airline_id = ?`,
                                  [airlineId],
                                  (err) => {
                                      if (err) {
                                          console.error("Error executing query:", err);
                                          res.status(500).send("Error deleting records");
                                          return;
                                      }

                                      pool.query(
                                          `DELETE FROM booked_packages WHERE transport_id = ?`,
                                          [transportId],
                                          (err) => {
                                              if (err) {
                                                  console.error("Error executing query:", err);
                                                  res.status(500).send("Error deleting records");
                                                  return;
                                              }

                                              pool.query(
                                                  `SELECT vendor_id FROM transport WHERE transport_id = ?`,
                                                  [transportId],
                                                  (err, vendorResult) => {
                                                      if (err) {
                                                          console.error("Error executing query:", err);
                                                          res.status(500).send("Error deleting records");
                                                          return;
                                                      }

                                                      if (vendorResult.length > 0) {
                                                          const vendorId = vendorResult[0].vendor_id;

                                                          pool.query(
                                                              `DELETE FROM transport WHERE transport_id = ?`,
                                                              [transportId],
                                                              (err) => {
                                                                  if (err) {
                                                                      console.error("Error executing query:", err);
                                                                      res.status(500).send("Error deleting records");
                                                                      return;
                                                                  }

                                                                  pool.query(
                                                                      `SELECT user_id FROM vendors WHERE vendor_id = ?`,
                                                                      [vendorId],
                                                                      (err, userResult) => {
                                                                          if (err) {
                                                                              console.error("Error executing query:", err);
                                                                              res.status(500).send("Error deleting records");
                                                                              return;
                                                                          }

                                                                          if (userResult.length > 0) {
                                                                              const userId = userResult[0].user_id;

                                                                              pool.query(
                                                                                  `DELETE FROM vendors WHERE vendor_id = ?`,
                                                                                  [vendorId],
                                                                                  (err) => {
                                                                                      if (err) {
                                                                                          console.error("Error executing query:", err);
                                                                                          res.status(500).send("Error deleting records");
                                                                                          return;
                                                                                      }

                                                                                      pool.query(
                                                                                          `DELETE FROM users WHERE user_id = ?`,
                                                                                          [userId],
                                                                                          (err) => {
                                                                                              if (err) {
                                                                                                  console.error("Error executing query:", err);
                                                                                                  res.status(500).send("Error deleting records");
                                                                                                  return;
                                                                                              }

                                                                                              res.sendStatus(204);
                                                                                          }
                                                                                      );
                                                                                  }
                                                                              );
                                                                          } else {
                                                                              console.error("No user found for the provided vendorId");
                                                                              res.status(404).send("No user found");
                                                                          }
                                                                      }
                                                                  );
                                                              }
                                                          );
                                                      } else {
                                                          console.error("No vendor found for the provided transportId");
                                                          res.status(404).send("No vendor found");
                                                      }
                                                  }
                                              );
                                          }
                                      );
                                  }
                              );
                          } else {
                              console.error("No transport found for the provided airlineId");
                              res.status(404).send("No transport found");
                          }
                      }
                  );
              }
          );
      }
  );
});

AdminRoutes.delete("/bus/:busId", (req, res) => {
  const busId = req.params.busId;

  // Step 1: Delete records from bus_packages
  pool.query(
      `DELETE FROM bus_packages WHERE bus_details_id IN (SELECT bus_details_id FROM bus_details WHERE bus_id = ?)`,
      [busId],
      (err) => {
          if (err) {
              console.error("Error executing query:", err);
              res.status(500).send("Error deleting records");
              return;
          }

          // Step 2: Delete records from bus_details
          pool.query(
              `DELETE FROM bus_details WHERE bus_id = ?`,
              [busId],
              (err) => {
                  if (err) {
                      console.error("Error executing query:", err);
                      res.status(500).send("Error deleting records");
                      return;
                  }

                  // Step 3: Select transport_id from bus_transport using given bus_id
                  pool.query(
                      `SELECT transport_id FROM bus_transport WHERE bus_id = ?`,
                      [busId],
                      (err, transportResult) => {
                          if (err) {
                              console.error("Error executing query:", err);
                              res.status(500).send("Error deleting records");
                              return;
                          }

                          if (transportResult.length > 0) {
                              const transportId = transportResult[0].transport_id;

                              // Step 4: Delete records from bus_transport
                              pool.query(
                                  `DELETE FROM bus_transport WHERE bus_id = ?`,
                                  [busId],
                                  (err) => {
                                      if (err) {
                                          console.error("Error executing query:", err);
                                          res.status(500).send("Error deleting records");
                                          return;
                                      }

                                      // Step 5: Delete records from booked_packages
                                      pool.query(
                                          `DELETE FROM booked_packages WHERE transport_id = ?`,
                                          [transportId],
                                          (err) => {
                                              if (err) {
                                                  console.error("Error executing query:", err);
                                                  res.status(500).send("Error deleting records");
                                                  return;
                                              }

                                              // Step 6: Select vendor_id from transport table using transport_id fetched from bus_transport
                                              pool.query(
                                                  `SELECT vendor_id FROM transport WHERE transport_id = ?`,
                                                  [transportId],
                                                  (err, vendorResult) => {
                                                      if (err) {
                                                          console.error("Error executing query:", err);
                                                          res.status(500).send("Error deleting records");
                                                          return;
                                                      }

                                                      if (vendorResult.length > 0) {
                                                          const vendorId = vendorResult[0].vendor_id;

                                                          // Step 7: Delete records from transport
                                                          pool.query(
                                                              `DELETE FROM transport WHERE transport_id = ?`,
                                                              [transportId],
                                                              (err) => {
                                                                  if (err) {
                                                                      console.error("Error executing query:", err);
                                                                      res.status(500).send("Error deleting records");
                                                                      return;
                                                                  }

                                                                  // Step 8: Select user_id from vendors table using vendor_id fetched from transport table
                                                                  pool.query(
                                                                      `SELECT user_id FROM vendors WHERE vendor_id = ?`,
                                                                      [vendorId],
                                                                      (err, userResult) => {
                                                                          if (err) {
                                                                              console.error("Error executing query:", err);
                                                                              res.status(500).send("Error deleting records");
                                                                              return;
                                                                          }

                                                                          if (userResult.length > 0) {
                                                                              const userId = userResult[0].user_id;

                                                                              // Step 9: Delete records from vendors
                                                                              pool.query(
                                                                                  `DELETE FROM vendors WHERE vendor_id = ?`,
                                                                                  [vendorId],
                                                                                  (err) => {
                                                                                      if (err) {
                                                                                          console.error("Error executing query:", err);
                                                                                          res.status(500).send("Error deleting records");
                                                                                          return;
                                                                                      }

                                                                                      // Step 10: Delete records from users
                                                                                      pool.query(
                                                                                          `DELETE FROM users WHERE user_id = ?`,
                                                                                          [userId],
                                                                                          (err) => {
                                                                                              if (err) {
                                                                                                  console.error("Error executing query:", err);
                                                                                                  res.status(500).send("Error deleting records");
                                                                                                  return;
                                                                                              }

                                                                                              res.sendStatus(204); // Successfully deleted
                                                                                          }
                                                                                      );
                                                                                  }
                                                                              );
                                                                          } else {
                                                                              console.error("No user found for the provided vendorId");
                                                                              res.status(404).send("No user found");
                                                                          }
                                                                      }
                                                                  );
                                                              }
                                                          );
                                                      } else {
                                                          console.error("No vendor found for the provided transportId");
                                                          res.status(404).send("No vendor found");
                                                      }
                                                  }
                                              );
                                          }
                                      );
                                  }
                              );
                          } else {
                              console.error("No transport found for the provided busId");
                              res.status(404).send("No transport found");
                          }
                      }
                  );
              }
          );
      }
  );
});


AdminRoutes.delete("/railway/:railwayId", (req, res) => {
  const railwayId = req.params.railwayId;

  // Step 1: Delete records from railway_packages
  pool.query(
      `DELETE FROM railway_packages WHERE railway_details_id IN (SELECT railway_details_id FROM railway_details WHERE railway_id = ?)`,
      [railwayId],
      (err) => {
          if (err) {
              console.error("Error executing query:", err);
              res.status(500).send("Error deleting records");
              return;
          }

          // Step 2: Delete records from railway_details
          pool.query(
              `DELETE FROM railway_details WHERE railway_id = ?`,
              [railwayId],
              (err) => {
                  if (err) {
                      console.error("Error executing query:", err);
                      res.status(500).send("Error deleting records");
                      return;
                  }

                  // Step 3: Select transport_id from railway_transport using given railway_id
                  pool.query(
                      `SELECT transport_id FROM railway_transport WHERE railway_id = ?`,
                      [railwayId],
                      (err, transportResult) => {
                          if (err) {
                              console.error("Error executing query:", err);
                              res.status(500).send("Error deleting records");
                              return;
                          }

                          if (transportResult.length > 0) {
                              const transportId = transportResult[0].transport_id;

                              // Step 4: Delete records from railway_transport
                              pool.query(
                                  `DELETE FROM railway_transport WHERE railway_id = ?`,
                                  [railwayId],
                                  (err) => {
                                      if (err) {
                                          console.error("Error executing query:", err);
                                          res.status(500).send("Error deleting records");
                                          return;
                                      }

                                      // Step 5: Delete records from booked_packages
                                      pool.query(
                                          `DELETE FROM booked_packages WHERE transport_id = ?`,
                                          [transportId],
                                          (err) => {
                                              if (err) {
                                                  console.error("Error executing query:", err);
                                                  res.status(500).send("Error deleting records");
                                                  return;
                                              }

                                              // Step 6: Select vendor_id from transport table using transport_id fetched from railway_transport
                                              pool.query(
                                                  `SELECT vendor_id FROM transport WHERE transport_id = ?`,
                                                  [transportId],
                                                  (err, vendorResult) => {
                                                      if (err) {
                                                          console.error("Error executing query:", err);
                                                          res.status(500).send("Error deleting records");
                                                          return;
                                                      }

                                                      if (vendorResult.length > 0) {
                                                          const vendorId = vendorResult[0].vendor_id;

                                                          // Step 7: Delete records from transport
                                                          pool.query(
                                                              `DELETE FROM transport WHERE transport_id = ?`,
                                                              [transportId],
                                                              (err) => {
                                                                  if (err) {
                                                                      console.error("Error executing query:", err);
                                                                      res.status(500).send("Error deleting records");
                                                                      return;
                                                                  }

                                                                  // Step 8: Select user_id from vendors table using vendor_id fetched from transport table
                                                                  pool.query(
                                                                      `SELECT user_id FROM vendors WHERE vendor_id = ?`,
                                                                      [vendorId],
                                                                      (err, userResult) => {
                                                                          if (err) {
                                                                              console.error("Error executing query:", err);
                                                                              res.status(500).send("Error deleting records");
                                                                              return;
                                                                          }

                                                                          if (userResult.length > 0) {
                                                                              const userId = userResult[0].user_id;

                                                                              // Step 9: Delete records from vendors
                                                                              pool.query(
                                                                                  `DELETE FROM vendors WHERE vendor_id = ?`,
                                                                                  [vendorId],
                                                                                  (err) => {
                                                                                      if (err) {
                                                                                          console.error("Error executing query:", err);
                                                                                          res.status(500).send("Error deleting records");
                                                                                          return;
                                                                                      }

                                                                                      // Step 10: Delete records from users
                                                                                      pool.query(
                                                                                          `DELETE FROM users WHERE user_id = ?`,
                                                                                          [userId],
                                                                                          (err) => {
                                                                                              if (err) {
                                                                                                  console.error("Error executing query:", err);
                                                                                                  res.status(500).send("Error deleting records");
                                                                                                  return;
                                                                                              }

                                                                                              res.sendStatus(204); // Successfully deleted
                                                                                          }
                                                                                      );
                                                                                  }
                                                                              );
                                                                          } else {
                                                                              console.error("No user found for the provided vendorId");
                                                                              res.status(404).send("No user found");
                                                                          }
                                                                      }
                                                                  );
                                                              }
                                                          );
                                                      } else {
                                                          console.error("No vendor found for the provided transportId");
                                                          res.status(404).send("No vendor found");
                                                      }
                                                  }
                                              );
                                          }
                                      );
                                  }
                              );
                          } else {
                              console.error("No transport found for the provided railwayId");
                              res.status(404).send("No transport found");
                          }
                      }
                  );
              }
          );
      }
  );
});



module.exports = AdminRoutes;
const express = require("express");
const router = express.Router();
const pool = require("./Db/db");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const verifyAsync = promisify(jwt.verify);
const secretKey = "safarnama";
const multer = require('multer');

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/places", (req, res) => {
  pool.query(
    "SELECT * from places order by RAND()",
    (error, results, fields) => {
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).send("Error fetching data");
        return;
      }
      results.forEach((place) => {
        place.images = Buffer.from(place.images).toString("base64");
        place.gallery = place.gallery.split(",").map((image) => image.trim());
      });
      res.json(results);
    }
  );
});

router.get("/packages", (req, res) => {
  pool.query("SELECT * from packages ", (error, results, feilds) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }
    res.json(results);
  });
});

router.get("/top-rated-places", async (req, res) => {
  try {
    pool.query(
      "SELECT * FROM places ORDER BY rating DESC LIMIT 10",
      (error, results, fields) => {
        if (error) {
          console.error("Error executing query:", error);
          res.status(500).send("Error fetching data");
          return;
        }

        results.forEach((place) => {
          place.images = Buffer.from(place.images).toString("base64");
          place.gallery = place.gallery.split(",").map((image) => image.trim());
        });

        // Process the results
        // const topPlaces = results.map((place) => {
        //   // Assuming 'images' and 'gallery' are fields in the 'places' table
        //   place.images = Buffer.from(place.images, "base64").toString();
        //   place.gallery = place.gallery.split(",").map((image) => image.trim());
        //   return place;
        // });

        // Send the processed top places as response
        res.json(results);
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/railway-packages", (req, res) => {
  pool.query("SELECT * from railway_packages", (error, results, feilds) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }
    res.json(results);
  });
});

router.get("/airline-packages", (req, res) => {
  const query = `
    SELECT ap.*, ad.name 
    FROM airline_packages AS ap 
    JOIN airline_details AS ad ON ap.airline_details_id = ad.airline_details_id
  `;
  pool.query(query, (error, results, fields) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }
    res.json(results);
  });
});

router.get("/airline-packages/:ticketId", (req, res) => {
  const { ticketId } = req.params;
  console.log(ticketId);
  const query = `
    SELECT ap.*, ad.name 
    FROM airline_packages AS ap 
    JOIN airline_details AS ad ON ap.airline_details_id = ad.airline_details_id
    WHERE ap.flight_number = ?
  `;
  pool.query(query, [ticketId], (error, results, fields) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }
    console.log(results);
    res.json(results);
  });
});

router.get("/railway-packages/:ticketId", (req, res) => {
  const { ticketId } = req.params;
  console.log(ticketId);
  const query = `
    SELECT rp.*, rd.name 
    FROM railway_packages AS rp 
    JOIN railway_details AS rd ON rp.railway_details_id = rd.railway_details_id
    WHERE rp.train_number = ?
  `;
  pool.query(query, [ticketId], (error, results, fields) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching railway data");
      return;
    }
    console.log(results);
    res.json(results);
  });
});

router.get("/bus-packages/:ticketId", (req, res) => {
  const { ticketId } = req.params;
  console.log(ticketId);
  const query = `
    SELECT bp.*, bd.name 
    FROM bus_packages AS bp 
    JOIN bus_details AS bd ON bp.bus_details_id = bd.bus_details_id
    WHERE bp.bus_number = ?
  `;
  pool.query(query, [ticketId], (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching bus data");
      return;
    }
    console.log(results);
    res.json(results);
  });
});

router.post("/add-airline-package-details/:ticketId", (req, res) => {
  const { ticketId } = req.params;
  const { package_id, ticket_price } = req.body;

  console.log(ticketId);
  console.log(package_id);
  console.log(ticket_price);

  const airlineOperationQuery = `
    SELECT airline_operations_id
    FROM airline_packages 
    WHERE flight_number = ?
  `;

  pool.query(airlineOperationQuery, [ticketId], (error, results) => {
    if (error) {
      console.error("Error executing airline operation query:", error);
      return res.status(500).send("Error fetching data");
    }

    console.log(results); // Log the entire results to see the structure

    if (!results || results.length === 0) {
      return res.status(404).send("Ticket not found");
    }

    const airlineOperationsId = results[0].airline_operations_id;
    console.log(airlineOperationsId);

    // Insert into package_details table
    const insertQuery = `
      INSERT INTO package_details (package_id, airline_operations_id) 
      VALUES (?, ?)
    `;
    const values = [package_id, airlineOperationsId];

    pool.query(insertQuery, values, (insertError, _) => {
      if (insertError) {
        console.error("Error executing insert query:", insertError);
        return res.status(500).send("Error inserting data");
      }

      // Update price in packages table
      const updateQuery = `
        UPDATE packages
        SET price = price + ?
        WHERE package_id = ?
      `;
      const updateValues = [ticket_price, package_id];

      pool.query(updateQuery, updateValues, (updateError, _) => {
        if (updateError) {
          console.error("Error updating package price:", updateError);
          return res.status(500).send("Error updating package price");
        }

        res.status(200).send("Package details inserted and price updated successfully");
      });
    });
  });
});


router.post("/add-bus-package-details/:ticketId", (req, res) => {
  const { ticketId } = req.params;
  const { package_id, ticket_price } = req.body;

  console.log(ticketId);
  console.log(package_id);
  console.log(ticket_price);

  const busOperationQuery = `
    SELECT bus_package_id 
    FROM bus_packages 
    WHERE bus_number = ?
  `;

  pool.query(busOperationQuery, [ticketId], (error, results) => {
    if (error) {
      console.error("Error executing bus operation query:", error);
      return res.status(500).send("Error fetching data");
    }

    console.log(results); // Log the entire results to see the structure

    if (!results || results.length === 0) {
      return res.status(404).send("Ticket not found");
    }

    const busOperationsId = results[0].bus_package_id;
    console.log(busOperationsId);

    // Insert into package_details table
    const insertQuery = `
      INSERT INTO package_details (package_id, bus_package_id) 
      VALUES (?, ?)
    `;
    const values = [package_id, busOperationsId];

    pool.query(insertQuery, values, (insertError, _) => {
      if (insertError) {
        console.error("Error executing insert query:", insertError);
        return res.status(500).send("Error inserting data");
      }

      // Update price in packages table
      const updateQuery = `
        UPDATE packages
        SET price = price + ?
        WHERE package_id = ?
      `;
      const updateValues = [ticket_price, package_id];

      pool.query(updateQuery, updateValues, (updateError, _) => {
        if (updateError) {
          console.error("Error updating package price:", updateError);
          return res.status(500).send("Error updating package price");
        }

        res.status(200).send("Package details inserted and price updated successfully");
      });
    });
  });
});


router.post("/add-railway-package-details/:ticketId", (req, res) => {
  const { ticketId } = req.params;
  const { package_id, ticket_price } = req.body;

  console.log(ticketId);
  console.log(package_id);
  console.log(ticket_price);

  const railwayOperationQuery = `
    SELECT railway_package_id 
    FROM railway_packages 
    WHERE train_number = ?
  `;

  pool.query(railwayOperationQuery, [ticketId], (error, results) => {
    if (error) {
      console.error("Error executing railway operation query:", error);
      return res.status(500).send("Error fetching data");
    }

    console.log(results); // Log the entire results to see the structure

    if (!results || results.length === 0) {
      return res.status(404).send("Ticket not found");
    }

    const railwayOperationsId = results[0].railway_package_id;
    console.log(railwayOperationsId);

    // Insert into package_details table
    const insertQuery = `
      INSERT INTO package_details (package_id, railway_package_id) 
      VALUES (?, ?)
    `;
    const values = [package_id, railwayOperationsId];

    pool.query(insertQuery, values, (insertError, _) => {
      if (insertError) {
        console.error("Error executing insert query:", insertError);
        return res.status(500).send("Error inserting data");
      }

      // Update price in packages table
      const updateQuery = `
        UPDATE packages
        SET price = price + ?
        WHERE package_id = ?
      `;
      const updateValues = [ticket_price, package_id];

      pool.query(updateQuery, updateValues, (updateError, _) => {
        if (updateError) {
          console.error("Error updating package price:", updateError);
          return res.status(500).send("Error updating package price");
        }

        res.status(200).send("Package details inserted and price updated successfully");
      });
    });
  });
});


router.get("/bus-packages", (req, res) => {
  pool.query("SELECT * from bus_packages", (error, results, feilds) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }
    res.json(results);
  });
});

router.get("/hotel-details", (req, res) => {
  pool.query("SELECT * FROM hotel_details", (error, results, fields) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }

    results.forEach((hotel) => {
      hotel.images = Buffer.from(hotel.images).toString("base64");
      hotel.gallery = hotel.gallery.split(",").map((image) => image.trim());
    });

    res.json(results);
  });
});

router.get("/tourist-details", async (req, res) => {
  const authToken = req.headers.authorization;

  if (!authToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = authToken.split(" ")[1];
    const decodedToken = await verifyAsync(token, secretKey);

    if (!decodedToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = decodedToken.userId;

    const query = `
      SELECT td.*
      FROM tourist_details td
      INNER JOIN tourists t ON td.tourist_id = t.tourist_id
      WHERE t.user_id = ?
    `;

    pool.query(query, [userId], (error, results) => {
      if (error) {
        console.error("Error fetching tourist details:", error);
        return res.status(500).json({ error: "Error fetching data" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Tourist details not found" });
      }

      const user = results[0];

      results.forEach((user) => {
        user.picture = Buffer.from(user.picture).toString("base64");
      });

      res.status(200).json(user);
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tourist-unrated-packages", async (req, res) => {
  const authToken = req.headers.authorization;

  if (!authToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = authToken.split(" ")[1];
    const decodedToken = await verifyAsync(token, secretKey);

    if (!decodedToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = decodedToken.userId;

    pool.query(
      "SELECT tourist_id FROM tourists WHERE user_id = ?",
      [userId],
      (error, results, fields) => {
        if (error) {
          console.error("Error fetching tourist ID:", error);
          res.status(500).send("Error fetching data");
          return;
        }

        if (results.length === 0) {
          console.error("Tourist ID not found for user:", userId);
          res.status(404).send("Tourist ID not found");
          return;
        }

        const tourist_id = results[0].tourist_id;
        console.log(tourist_id);

        pool.query(
          "SELECT * FROM packages WHERE tourist_id = ? AND rating IS NULL  ORDER BY tourist_id ASC LIMIT 10",
          [tourist_id],
          (error, results, fields) => {
            if (error) {
              console.error("Error executing query:", error);
              res.status(500).send("Error fetching data");
              // return;
            }
            console.log(results);
            res.json(results);
          }
        );
      }
    );
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tourist-rated-packages", async (req, res) => {
  const authToken = req.headers.authorization;

  if (!authToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = authToken.split(" ")[1];
    const decodedToken = await verifyAsync(token, secretKey);

    if (!decodedToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = decodedToken.userId;

    pool.query(
      "SELECT tourist_id FROM tourists WHERE user_id = ?",
      [userId],
      (error, results, fields) => {
        if (error) {
          console.error("Error fetching tourist ID:", error);
          res.status(500).send("Error fetching data");
          return;
        }

        if (results.length === 0) {
          console.error("Tourist ID not found for user:", userId);
          res.status(404).send("Tourist ID not found");
          return;
        }

        const tourist_id = results[0].tourist_id;
        console.log(tourist_id);

        pool.query(
          "SELECT * FROM packages WHERE tourist_id = ? AND rating IS NOT NULL",
          [tourist_id],
          (error, results, fields) => {
            if (error) {
              console.error("Error executing query:", error);
              res.status(500).send("Error fetching data");
              // return;
            }
            console.log(results);
            res.json(results);
          }
        );
      }
    );
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/update-rating", (req, res) => {
  const { package_id, rating } = req.body;

  if (rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ error: "Invalid rating. Rating must be between 1 and 5." });
  }

  pool.query(
    "UPDATE packages SET rating = ? WHERE package_id = ?",
    [rating, package_id],
    (error, results, fields) => {
      if (error) {
        console.error("Error updating rating:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.status(200).json({ message: "Rating updated successfully" });
    }
  );
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

router.get("/tourist-details", async (req, res) => {
  const authToken = req.headers.authorization;

  if (!authToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = authToken.split(" ")[1];
    const decodedToken = await verifyAsync(token, secretKey);

    if (!decodedToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = decodedToken.userId;

    const query = `
      SELECT td.*
      FROM tourist_details td
      INNER JOIN tourists t ON td.tourist_id = t.tourist_id
      WHERE t.user_id = ?
    `;

    pool.query(query, [userId], (error, results) => {
      if (error) {
        console.error("Error fetching tourist details:", error);
        return res.status(500).json({ error: "Error fetching data" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Tourist details not found" });
      }

      const user = results[0];

      results.forEach((user) => {
        user.picture = Buffer.from(user.picture).toString("base64");
      });

      res.status(200).json(user);
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/create-package", async (req, res) => {
  const authToken = req.headers.authorization;
  const {
    destination,
    dateSelect1,
    dateSelect2,
    adultPreference,
    numberOfIndividuals,
  } = req.body;
  console.log(req.body);
  if (!authToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log(dateSelect1);

  try {
    const token = authToken.split(" ")[1];
    const decodedToken = await verifyAsync(token, secretKey);

    if (!decodedToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = decodedToken.userId;

    const touristIdQuery = "SELECT tourist_id FROM tourists WHERE user_id = ?";
    pool.query(touristIdQuery, [userId], (error, results) => {
      if (error) {
        console.error("Error fetching tourist ID:", error);
        return res.status(500).json({ error: "Error fetching data" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Tourist ID not found" });
      }

      const touristId = results[0].tourist_id;

      const insertPackageQuery = `
        INSERT INTO packages (destination, start_date, end_date, preferences, no_of_person, tourist_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [
        destination,
        dateSelect1,
        dateSelect2,
        adultPreference,
        numberOfIndividuals,
        touristId,
      ];

      pool.query(insertPackageQuery, values, (insertError, insertResults) => {
        if (insertError) {
          console.error("Error inserting package details:", insertError);
          return res.status(500).json({ error: "Error inserting data" });
        }
        const packageId = insertResults.insertId; // Retrieve the generated package_id
        res.status(200).json({
          message: "Package created successfully",
          package_id: packageId,
        });
      });
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/guide-service", (req, res) => {
  const query = `
    SELECT
      guide_personal_details_id,
      guide_id,
      name,
      age,
      email,
      address,
      contact_number,
      cnic_number,
      picture,
      cnic_front_picture,
      cnic_back_picture,
      guide_license_picture
    FROM guide_personal_details
  `;

  pool.query(query, (error, results, fields) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }

    results.forEach((guide) => {
      guide.picture = guide.picture
        ? Buffer.from(guide.picture).toString("base64")
        : null;
      guide.cnic_front_picture = guide.cnic_front_picture
        ? Buffer.from(guide.cnic_front_picture).toString("base64")
        : null;
      guide.cnic_back_picture = guide.cnic_back_picture
        ? Buffer.from(guide.cnic_back_picture).toString("base64")
        : null;
      guide.guide_license_picture = guide.guide_license_picture
        ? Buffer.from(guide.guide_license_picture).toString("base64")
        : null;
    });

    res.json(results);
  });
});

router.get("/car-rental-service", (req, res) => {
  const query = `
    SELECT
      car_rental_id,
      car_name,
      car_make,
      car_model,
      driver_name,
      contact_number,
      price,
      rating,
      Picture
    FROM car_rental_service
  `;

  pool.query(query, (error, results, fields) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }

    results.forEach((car) => {
      car.Picture = Buffer.from(car.Picture).toString("base64");
    });

    res.json(results);
  });
});

router.post("/update-package-details", (req, res) => {
  const { package_id, guideId, carRentalId } = req.body;

  // Validate input
  if (!package_id || !guideId || !carRentalId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const updateQuery = `
    UPDATE package_details
    SET guide_id = ?, car_rental_id = ?
    WHERE package_id = ?
  `;

  pool.query(
    updateQuery,
    [guideId, carRentalId, packageId],
    (error, results) => {
      if (error) {
        console.error("Error updating package details:", error);
        return res.status(500).json({ error: "Error updating package details" });
      }

      res.status(200).json({ message: "Package details updated successfully" });
    }
  );
});

router.get("/packages/:package_id", (req, res) => {
  const { package_id } = req.params;
  const selectQuery = `
    SELECT start_date, end_date
    FROM packages
    WHERE package_id = ?
  `;

  pool.query(selectQuery, [package_id], (error, results) => {
    if (error) {
      console.error("Error fetching package details:", error);
      res.status(500).json({ error: "Error fetching package details" });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: "Package not found" });
      return;
    }

    const { start_date, end_date } = results[0];
    res.status(200).json({ start_date, end_date });
  });
});

router.post("/hotels", (req, res) => {
  let requestData;

  // Check if the request body is JSON
  if (req.is("application/json")) {
    requestData = req.body;
  } else {
    // Parse the request body as JSON if it's not already parsed
    try {
      requestData = JSON.parse(req.body);
    } catch (error) {
      console.error("Error parsing request data:", error);
      res.status(400).json({ error: "Invalid request data format" });
      return;
    }
  }

  const { hotel_booking_id, package_id, hotel_details_id, day } = requestData;

  console.log(package_id);
  console.log(hotel_booking_id);
  console.log(hotel_details_id);

  const roomQuery = `
    SELECT room_type_name, rooms, price
    FROM hotel_booking
    WHERE package_id = ? AND hotel_booking_id = ?
  `;
  pool.query(
    roomQuery,
    [package_id, hotel_booking_id],
    (error1, roomResults) => {
      if (error1) {
        console.error("Error fetching room information:", error1);
        res.status(500).json({ error: "Error fetching room information" });
        return;
      }

      console.log(roomResults);

      const hotelQuery = `
      SELECT name, area
      FROM hotel_details
      WHERE hotel_details_id = ?
    `;
      pool.query(hotelQuery, [hotel_details_id], (error2, hotelResults) => {
        if (error2) {
          console.error("Error fetching hotel name:", error2);
          res.status(500).json({ error: "Error fetching hotel name" });
          return;
        }

        console.log(hotelResults);

        const response = {
          room_type_name: roomResults[0]?.room_type_name || null,
          rooms: roomResults[0]?.rooms || null,
          price: roomResults[0]?.price || null,
          name: hotelResults[0]?.name || null,
          area: hotelResults[0]?.area || null,
        };

        console.log(response);

        res.status(200).json(response);
      });
    }
  );
});

router.post("/hotel-booking", async (req, res) => {
  try {
    // Extract token from request headers
    const authToken = req.headers.authorization;
    if (!authToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authToken.split(" ")[1];

    // Decode token to get userId
    const decodedToken = await verifyAsync(token, secretKey);
    if (!decodedToken) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userId = decodedToken.userId;

    // Fetch tourist_id from tourist table using user_id
    pool.query(
      "SELECT tourist_id FROM tourists WHERE user_id = ?",
      [userId],
      (touristIdError, touristIdResults) => {
        if (touristIdError) {
          console.error("Error fetching tourist ID:", touristIdError);
          return res.status(500).json({ error: "Error fetching data" });
        }

        if (touristIdResults.length === 0) {
          return res.status(404).json({ error: "Tourist not found" });
        }

        const touristId = touristIdResults[0].tourist_id;

        // Extract data from request body
        const {
          hotel_details_id,
          name,
          price,
          checkInDate,
          checkOutDate,
          rooms,
          package_id,
          day,
        } = req.body;

        // Parse date strings into JavaScript Date objects
        const parsedCheckInDate = new Date(checkInDate);
        const parsedCheckOutDate = new Date(checkOutDate);

        // Format dates into MySQL-compatible format ('YYYY-MM-DD')
        const formattedCheckInDate = `${parsedCheckInDate.getFullYear()}-${(
          parsedCheckInDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${parsedCheckInDate
          .getDate()
          .toString()
          .padStart(2, "0")}`;
        const formattedCheckOutDate = `${parsedCheckOutDate.getFullYear()}-${(
          parsedCheckOutDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${parsedCheckOutDate
          .getDate()
          .toString()
          .padStart(2, "0")}`;

        // Decrement the room count based on the room type
        let roomFieldToUpdate;
        switch (name) {
          case "Single Bed Room":
            roomFieldToUpdate = "rooms_single_bed";
            break;
          case "Double Bed Room":
            roomFieldToUpdate = "rooms_double_bed";
            break;
          case "Standard Room":
            roomFieldToUpdate = "rooms_standard";
            break;
          case "Executive Room":
            roomFieldToUpdate = "rooms_executive";
            break;
          default:
            return res.status(400).json({ error: "Invalid room type" });
        }

        // Update the room count in the hotel_details table
        const updateQuery = `UPDATE hotel_details SET ${roomFieldToUpdate} = ${roomFieldToUpdate} - ? WHERE hotel_details_id = ?`;
        const updateValues = [rooms, hotel_details_id];
        pool.query(updateQuery, updateValues, (updateError, updateResults) => {
          if (updateError) {
            console.error("Error updating room count:", updateError);
            return res.status(500).json({ error: "Error updating room count" });
          }

          // Insert data into hotel_booking table
          const insertQuery = `
                  INSERT INTO hotel_booking (tourist_id, hotel_details_id, room_type_name, price, check_in, check_out, rooms, package_id)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `;
          const insertValues = [
            touristId,
            hotel_details_id,
            name,
            price,
            formattedCheckInDate,
            formattedCheckOutDate,
            rooms,
            package_id,
          ];
          pool.query(
            insertQuery,
            insertValues,
            (insertError, insertResults) => {
              if (insertError) {
                console.error("Error inserting data:", insertError);
                // Roll back the room count update
                pool.query(
                  `UPDATE hotel_details SET ${roomFieldToUpdate} = ${roomFieldToUpdate} + ? WHERE hotel_details_id = ?`,
                  [rooms, hotel_details_id],
                  (rollbackError, rollbackResults) => {
                    if (rollbackError) {
                      console.error(
                        "Error rolling back room count update:",
                        rollbackError
                      );
                    }
                    return res
                      .status(500)
                      .json({ error: "Error inserting data" });
                  }
                );
              }

              const hotelBookingId = insertResults.insertId;
              // Insert data into package_hotel_details table
              const packageHotelDetailsQuery = `
                      INSERT INTO package_hotel_details (package_id, hotel_booking_id, day)
                      VALUES (?, ?, ?)
                  `;
              const packageHotelDetailsValues = [
                package_id,
                hotelBookingId,
                day,
              ];
              pool.query(
                packageHotelDetailsQuery,
                packageHotelDetailsValues,
                (phdError, phdResults) => {
                  if (phdError) {
                    console.error(
                      "Error inserting data into package_hotel_details:",
                      phdError
                    );
                  }

                  const packageHotelDetailsId = phdResults.insertId;

                  // Update package price in packages table
                  const updatePackagePriceQuery = `
                      UPDATE packages
                      SET price = price + ?
                      WHERE package_id = ?
                  `;
                  const updatePackagePriceValues = [price, package_id];
                  pool.query(
                    updatePackagePriceQuery,
                    updatePackagePriceValues,
                    (updatePriceError, updatePriceResults) => {
                      if (updatePriceError) {
                        console.error(
                          "Error updating package price:",
                          updatePriceError
                        );
                        // Return error response
                        return res
                          .status(500)
                          .json({ error: "Error updating package price" });
                      }
                      
                      res.status(200).json({
                        message: "Booking added successfully",
                        hotel_booking_id: hotelBookingId,
                        package_hotel_details_id: packageHotelDetailsId,
                      });
                    }
                  );
                }
              );
            }
          );
        });
      }
    );
  } catch (error) {
    console.error("Error adding booking:", error);
    // Return error response
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/Itinerary", async (req, res) => {
  const authToken = req.headers.authorization;

  if (!authToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = authToken.split(" ")[1];
    const decodedToken = await verifyAsync(token, secretKey);

    if (!decodedToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = decodedToken.userId;

    pool.query(
      "SELECT tourist_id FROM tourists WHERE user_id = ?",
      [userId],
      (touristError, touristResults) => {
        if (touristError || touristResults.length === 0) {
          return res.status(404).json({ error: "Tourist details not found" });
        }

        const touristId = touristResults[0].tourist_id;

        pool.query(
          "SELECT package_id FROM packages WHERE tourist_id = ?",
          [touristId],
          (packageError, packageResults) => {
            if (packageError || packageResults.length === 0) {
              return res
                .status(404)
                .json({ error: "Package details not found" });
            }

            const packageId = packageResults[0].package_id;

            pool.query(
              "SELECT * FROM packages WHERE package_id = ?",
              [packageId],
              (packageError, packageResults) => {
                if (packageError || packageResults.length === 0) {
                  return res
                    .status(404)
                    .json({ error: "Package details not found" });
                }
                // console.log(ho);
                pool.query(
                  "SELECT * FROM package_details WHERE package_id = ?",
                  [packageId],
                  (packageDetailError, packageDetailResults) => {
                    if (
                      packageDetailError ||
                      packageDetailResults.length === 0
                    ) {
                      return res
                        .status(404)
                        .json({ error: "Package details not found" });
                    }

                    pool.query(
                      "SELECT name, contact_number, picture FROM guide_personal_details WHERE guide_id = ?",
                      [packageDetailResults[0].guide_id],
                      (guideError, guideResults) => {
                        if (guideError || guideResults.length === 0) {
                          return res
                            .status(404)
                            .json({ error: "Guide details not found" });
                        }

                        if (
                          guideResults[0].picture !== null &&
                          guideResults[0].picture !== undefined
                        ) {
                          guideResults[0].picture = Buffer.from(
                            guideResults[0].picture,
                            "binary"
                          ).toString("base64");
                        }

                        pool.query(
                          "SELECT car_name, driver_name, contact_number, Picture FROM car_rental_service WHERE car_rental_id = ?",
                          [packageDetailResults[0].car_rental_id],
                          (carRentalError, carRentalResults) => {
                            if (
                              carRentalError ||
                              carRentalResults.length === 0
                            ) {
                              return res.status(404).json({
                                error: "Car rental details not found",
                              });
                            }

                            // Convert Picture field in carRentalResults to base64 string
                            carRentalResults[0].Picture = Buffer.from(
                              carRentalResults[0].Picture,
                              "binary"
                            ).toString("base64");

                            pool.query(
                              "SELECT hotel_booking_id, day FROM package_hotel_details WHERE package_id = ?",
                              [packageId],
                              (hotelBookingError, hotelBookingResults) => {
                                if (
                                  hotelBookingError ||
                                  hotelBookingResults.length === 0
                                ) {
                                  return res.status(404).json({
                                    error: "Hotel booking details not found",
                                  });
                                }

                                const hotelBookingIds = hotelBookingResults.map(
                                  (row) => row.hotel_booking_id
                                );

                                const hotelDetailsPromises =
                                  hotelBookingIds.map((hotelBookingId) => {
                                    return new Promise((resolve, reject) => {
                                      pool.query(
                                        "SELECT hb.*, hd.name, hd.area FROM hotel_booking hb JOIN hotel_details hd ON hb.hotel_details_id = hd.hotel_details_id WHERE hb.hotel_booking_id = ?",
                                        [hotelBookingId],
                                        (
                                          hotelBookingDetailsError,
                                          hotelBookingDetailsResults
                                        ) => {
                                          if (
                                            hotelBookingDetailsError ||
                                            hotelBookingDetailsResults.length ===
                                              0
                                          ) {
                                            reject({
                                              error:
                                                "Hotel booking details not found",
                                            });
                                          } else {
                                            resolve(
                                              hotelBookingDetailsResults[0]
                                            );
                                          }
                                        }
                                      );
                                    });
                                  });

                                Promise.all(hotelDetailsPromises)
                                  .then((hotelDetailsArray) => {
                                    const response = {
                                      packageDetails: packageDetailResults[0],
                                      guideDetails: guideResults[0],
                                      carRentalDetails: carRentalResults[0],
                                      hotelBookingDetails: hotelBookingResults,
                                      hotelDetails: hotelDetailsArray,
                                      package: packageResults[0],
                                    };
                                    
                                    res.status(200).json(response);
                                  })
                                  .catch((error) => {
                                    console.error(
                                      "Error fetching hotel booking details:",
                                      error
                                    );
                                    res
                                      .status(500)
                                      .json({ error: "Internal server error" });
                                  });
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/booked-packages', async (req, res) => {
    const authToken = req.headers.authorization;
    const packageId = req.query.packageId; // Assuming the packageId is passed as a query parameter

    if (!authToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const token = authToken.split(' ')[1];
        const decodedToken = await verifyAsync(token, secretKey);

        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userId = decodedToken.userId;

        // Fetch the tourist ID using the user ID
        const touristIdQuery = `
            SELECT tourist_id
            FROM tourists
            WHERE user_id = ?
        `;

        pool.query(touristIdQuery, [userId], async (error, results) => {
            if (error) {
                console.error('Error fetching tourist ID:', error);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Tourist ID not found' });
            }

            const touristId = results[0].tourist_id;

            // Insert package ID and tourist ID into booked packages table
            const insertQuery = `
                INSERT INTO booked_packages (package_id, tourist_id)
                VALUES (?, ?)
            `;

            pool.query(insertQuery, [packageId, touristId], (error, results) => {
                if (error) {
                    console.error('Error inserting into booked_packages:', error);
                    return res.status(500).json({ error: 'Error inserting data' });
                }

                res.status(200).json({ message: 'Package booked successfully' });
            });
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/booked-packages', async (req, res) => {
    const authToken = req.headers.authorization;
    const packageId = req.query.packageId; // Assuming the packageId is passed as a query parameter

    if (!authToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const token = authToken.split(' ')[1];
        const decodedToken = await verifyAsync(token, secretKey);

        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userId = decodedToken.userId;

        // Fetch the tourist ID using the user ID
        const touristIdQuery = `
            SELECT tourist_id
            FROM tourists
            WHERE user_id = ?
        `;

        pool.query(touristIdQuery, [userId], async (error, results) => {
            if (error) {
                console.error('Error fetching tourist ID:', error);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Tourist ID not found' });
            }

            const touristId = results[0].tourist_id;

            // Insert package ID and tourist ID into booked packages table
            const insertQuery = `
                INSERT INTO booked_packages (package_id, tourist_id)
                VALUES (?, ?)
            `;

            pool.query(insertQuery, [packageId, touristId], (error, results) => {
                if (error) {
                    console.error('Error inserting into booked_packages:', error);
                    return res.status(500).json({ error: 'Error inserting data' });
                }

                res.status(200).json({ message: 'Package booked successfully' });
            });
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post("/tourist_personal_details", upload.single('image'), async (req, res) => {

  const { fullName, age, email, address, phoneNumber, cnicNumber, userId } = req.body;

  try {

console.log(userId);
    
    pool.query(
      "SELECT tourist_id FROM tourists WHERE user_id = ?",
      [userId],
      (guideIdError, guideIdResults) => {
        if (guideIdError) {
          console.error("Error fetching guideId:", guideIdError);
          return res.status(500).json({ error: "Error fetching guideId" });
        }

        if (guideIdResults.length === 0) {
          return res.status(404).json({ error: "Guide not found" });
        }

        const touristId = guideIdResults[0].tourist_id;

        const image = req.file.buffer;
        console.log(image);
        const insertQuery = `
          INSERT INTO tourist_details (tourist_id, name, age, email, contact_no, address, cinic_number, picture)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertValues = [
          touristId,
          fullName,
          age,
          email,
          phoneNumber,
          address,
          cnicNumber,
          image,
        ];

        pool.query(insertQuery, insertValues, (insertError, insertResults) => {
          if (insertError) {
            console.error(
              "Error inserting guide personal details:",
              insertError
            );
            return res.status(500).json({ error: "Error inserting data" });
          }
        });
        res
          .status(200)
          .json({ message: "User registered successfully" });
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;


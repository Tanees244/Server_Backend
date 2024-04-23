const express = require("express");
const router = express.Router();
const pool = require("./Db/db");
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const verifyAsync = promisify(jwt.verify);
const secretKey = 'safarnama';

router.get("/places", (req, res) => {
  pool.query("SELECT * from places", (error, results, fields) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }
    results.forEach(place => {
      place.image = Buffer.from(place.image).toString('base64');
      // place.gallery = place.gallery.split(',').map(image => image.trim());
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
  pool.query("SELECT * from airline_packages", (error, results, feilds) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error fetching data");
      return;
    }
    res.json(results);
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

// router.get("/hotel-details", (req, res) => {
//   pool.query("SELECT * FROM hotel_details", (error, results, fields) => {
//     if (error) {
//       console.error("Error executing query:", error);
//       res.status(500).send("Error fetching data");
//       return;
//     }

//     // Convert image data to base64
//     results.forEach(hotel => {
//       hotel.image = Buffer.from(hotel.image).toString('base64');
//       hotel.gallery = hotel.gallery.split(',').map(image => image.trim());
//     });


//     res.json(results);
//   });
// });
router.get('/tourist-details', async (req, res) => {
  
  const authToken = req.headers.authorization;
  
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

    const query = `
      SELECT td.*
      FROM tourist_details td
      INNER JOIN tourists t ON td.tourist_id = t.tourist_id
      WHERE t.user_id = ?
    `;
    
    pool.query(query, [userId], (error, results) => {
      if (error) {
        console.error('Error fetching tourist details:', error);
        return res.status(500).json({ error: 'Error fetching data' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Tourist details not found' });
      }

      const user = results[0];

      results.forEach(user => {
        user.picture = Buffer.from(user.picture).toString('base64');
      });

      res.status(200).json(user);
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
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

router.get('/tourist-details', async (req, res) => {
  
  const authToken = req.headers.authorization;
  
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

    const query = `
      SELECT td.*
      FROM tourist_details td
      INNER JOIN tourists t ON td.tourist_id = t.tourist_id
      WHERE t.user_id = ?
    `;
    
    pool.query(query, [userId], (error, results) => {
      if (error) {
        console.error('Error fetching tourist details:', error);
        return res.status(500).json({ error: 'Error fetching data' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Tourist details not found' });
      }

      const user = results[0];

      results.forEach(user => {
        user.picture = Buffer.from(user.picture).toString('base64');
      });

      res.status(200).json(user);
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/create-package', async (req, res) => {
  const authToken = req.headers.authorization;
  const {
    destination,
    dateSelect1,
    dateSelect2,
    adultPreference,
    numberOfIndividuals,
  } = req.body;

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

    const touristIdQuery = 'SELECT tourist_id FROM tourists WHERE user_id = ?';
    pool.query(touristIdQuery, [userId], (error, results) => {
      if (error) {
        console.error('Error fetching tourist ID:', error);
        return res.status(500).json({ error: 'Error fetching data' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Tourist ID not found' });
      }

      const touristId = results[0].tourist_id;

      const insertPackageQuery = `
        INSERT INTO packages (destination, start_date, end_date, preferences, no_of_person, tourist_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [destination, dateSelect1, dateSelect2, adultPreference, numberOfIndividuals, touristId];

      pool.query(insertPackageQuery, values, (insertError, insertResults) => {
        if (insertError) {
          console.error('Error inserting package details:', insertError);
          return res.status(500).json({ error: 'Error inserting data' });
        }

        res.status(200).json({ message: 'Package created successfully' });
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;

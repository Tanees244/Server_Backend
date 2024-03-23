const express = require("express");
const AuthRouter = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const pool = require("./Db/db");
const jwt = require("jsonwebtoken");


const secretKey = "safarnama"; // Replace 'your_secret_key' with your actual secret key

const generateAuthToken = (userId) => {
  // Payload for the token (you can add more data as needed)
  const payload = {
    user_id: userId,
  };

  // Generate the JWT token with the payload and secret key
  const token = jwt.sign(payload, secretKey, { expiresIn: "1hr" }); // Adjust expiration as needed

  return token;
};

// Register a user with user_type
AuthRouter.post("/register", (req, res) => {
  const { email, password, user_type, vendor_type, transport_type } = req.body;

  // Check if the email is already registered
  pool.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (error, existingUser) => {
      if (error) {
        console.error("Error checking existing user:", error);
        return res.status(500).json({ error: "Error checking existing user" });
      }

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash the password using bcrypt
      bcrypt.hash(password, 10, (hashError, hashedPassword) => {
        if (hashError) {
          console.error("Error hashing password:", hashError);
          return res.status(500).json({ error: "Error hashing password" });
        }

        // Insert user data into the database
        pool.query(
          "INSERT INTO users (email, password, user_type) VALUES (?, ?, ?)",
          [email, hashedPassword, user_type],
          (insertError, userInsertResult) => {
            if (insertError) {
              console.error("Error inserting user data:", insertError);
              return res
                .status(500)
                .json({ error: "Error inserting user data" });
            }

            if (!userInsertResult || !userInsertResult.insertId) {
              return res
                .status(500)
                .json({ error: "Failed to insert user data" });
            }

            // Handle insertion into specific tables based on user_type
            const userId = userInsertResult.insertId;
            switch (user_type) {
              case "Guide":
                pool.query(
                  "INSERT INTO guides (user_id) VALUES (?)",
                  [userId],
                  (guideInsertError) => {
                    if (guideInsertError) {
                      console.error(
                        "Error inserting guide data:",
                        guideInsertError
                      );
                      return res
                        .status(500)
                        .json({ error: "Error inserting guide data" });
                    }
                    console.log(userId);
                    res
                      .status(201)
                      .json({ message: "User registered successfully" });
                  }
                );
                break;
              case "Tourist":
                // Insert data into tourists table with user_id
                pool.query(
                  "INSERT INTO tourists (user_id) VALUES (?)",
                  [userId],
                  (touristInsertError) => {
                    if (touristInsertError) {
                      console.error(
                        "Error inserting tourist data:",
                        touristInsertError
                      );
                      return res
                        .status(500)
                        .json({ error: "Error inserting tourist data" });
                    }
                    res
                      .status(201)
                      .json({ message: "User registered successfully" });
                  }
                );
                break;
              case "Vendor":
                // Insert data into vendors table with user_id and vendor_type
                pool.query(
                  "INSERT INTO vendors (user_id, vendor_type) VALUES (?, ?)",
                  [userId, vendor_type],
                  (vendorInsertError, vendorInsertResult) => {
                    if (vendorInsertError) {
                      console.error(
                        "Error inserting vendor data:",
                        vendorInsertError
                      );
                      return res
                        .status(500)
                        .json({ error: "Error inserting vendor data" });
                    }

                    if (!vendorInsertResult || !vendorInsertResult.insertId) {
                      return res
                        .status(500)
                        .json({ error: "Failed to insert vendor data" });
                    }

                    const vendorId = vendorInsertResult.insertId;
                    
                    // Handle insertion into specific transport tables based on vendor_type
                    switch (vendor_type) {
                      case "Hotel":
                        // Insert data into hotel_vendor table with vendor_id
                        pool.query(
                          "INSERT INTO hotels (vendor_id) VALUES (?)",
                          [vendorId],
                          (hotelInsertError) => {
                            if (hotelInsertError) {
                              console.error(
                                "Error inserting hotel vendor data:",
                                hotelInsertError
                              );
                              return res
                                .status(500)
                                .json({
                                  error: "Error inserting hotel vendor data",
                                });
                            }
                            res
                              .status(201)
                              .json({
                                message: "User registered successfully",
                              });
                          }
                        );
                        break;
                      case "Transport":
                        pool.query(
                            "INSERT INTO transport (vendor_id, transport_type) VALUES (?, ?)",
                            [vendorId, transport_type],
                            (transportInsertError, transportInsertResult) => {
                              if (transportInsertError) {
                                console.error(
                                  "Error inserting transport data:",
                                  transportInsertError
                                );
                                return res
                                  .status(500)
                                  .json({ error: "Error inserting transport data" });
                              }
          
                              if (!transportInsertResult || !transportInsertResult.insertId) {
                                return res
                                  .status(500)
                                  .json({ error: "Failed to insert transport data" });
                              }
          
                              const transportId = transportInsertResult.insertId;
                        // Handle further types of Transport Vendor (Airline, Railway, Bus)
                        switch (transport_type) {
                          case "Airline":
                            // Insert data into airline table with vendor_id
                            pool.query(
                              "INSERT INTO airline_transport (transport_id) VALUES (?)",
                              [transportId],
                              (airlineInsertError) => {
                                if (airlineInsertError) {
                                  console.error(
                                    "Error inserting airline data:",
                                    airlineInsertError
                                  );
                                  return res
                                    .status(500)
                                    .json({
                                      error: "Error inserting airline data",
                                    });
                                }
                                res
                                  .status(201)
                                  .json({
                                    message: "User registered successfully",
                                  });
                              }
                            );
                            break;
                          case "Railway":
                            // Insert data into railway table with vendor_id
                            pool.query(
                              "INSERT INTO railway_transport (transport_id) VALUES (?)",
                              [transportId],
                              (railwayInsertError) => {
                                if (railwayInsertError) {
                                  console.error(
                                    "Error inserting railway data:",
                                    railwayInsertError
                                  );
                                  return res
                                    .status(500)
                                    .json({
                                      error: "Error inserting railway data",
                                    });
                                }
                                res
                                  .status(201)
                                  .json({
                                    message: "User registered successfully",
                                  });
                              }
                            );
                            break;
                          case "Bus":
                            // Insert data into bus table with vendor_id
                            pool.query(
                              "INSERT INTO bus_transport (transport_id) VALUES (?)",
                              [transportId],
                              (busInsertError) => {
                                if (busInsertError) {
                                  console.error(
                                    "Error inserting bus data:",
                                    busInsertError
                                  );
                                  return res
                                    .status(500)
                                    .json({
                                      error: "Error inserting bus data",
                                    });
                                }
                                res
                                  .status(201)
                                  .json({
                                    message: "User registered successfully",
                                  });
                              }
                            );
                            break;
                          default:
                            res
                              .status(400)
                              .json({ error: "Invalid transport type" });
                            break;
                        }
                    });
                        break;
                      default:
                        res.status(400).json({ error: "Invalid vendor type" });
                        break;
                    }
                  }
                );
                break;
                // Handle other user types as needed
                res
                  .status(201)
                  .json({ message: "User registered successfully" });
                break;
            }
          }
        );
      });
    }
  );
});

// AuthRouter.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     pool.query(
//       "SELECT * from users Where email = ?",
//       [email],
//       async (error, results) => {
//         if (error) {
//           console.error("Error executing query:", error);
//           return res.status(500).send("Error fetching data");
//         }

//         if (!results || results.length === 0) {
//           console.log("User does not exist for email:", email);
//           return res.status(401).json({ error: "User does not exist" });
//         }

//         const user = results[0];
//         const isPasswordMatch = await bcrypt.compare(password, user.password);
//         if (!isPasswordMatch) {
//           console.log("Incorrect password for user:", email);
//           return res.status(401).json({ error: "Incorrect password" });
//         }

//         const token = jwt.sign(
//           { userId: user.user_id, email: user.email },
//           "safarnama",
//           {
//             expiresIn: "1h", 
//           }
//         );

//         res.status(200).json({ user, token });
//       }
//     );
//   } catch (error) {
//     console.error("Error authenticating user:", error);
//     res.status(500).json({ error: "Error authenticating user" });
//   }
// });

AuthRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (error, results) => {
        if (error) {
          console.error('Error executing query:', error);
          return res.status(500).send('Error fetching data');
        }

        if (!results || results.length === 0) {
          console.log('User does not exist for email:', email);
          return res.status(401).json({ error: 'User does not exist' });
        }

        const user = results[0];
        // For simplicity, assume password match for now
        // Replace this with your actual password comparison logic using bcrypt
        const isPasswordMatch = true;

        if (!isPasswordMatch) {
          console.log('Incorrect password for user:', email);
          return res.status(401).json({ error: 'Incorrect password' });
        }

        const token = jwt.sign(
          { userId: user.user_id, email: user.email },
          'safarnama',
          {
            expiresIn: '1h',
          }
        );

        res.status(200).json({ user, token });
      }
    );
  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(500).json({ error: 'Error authenticating user' });
  }
});



module.exports = AuthRouter;

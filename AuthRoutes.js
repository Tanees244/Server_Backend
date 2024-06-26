const express = require("express");
const AuthRouter = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("./Db/db");
const jwt = require("jsonwebtoken");

const adminUsername = 'admin';
const adminPassword = 'admin';

AuthRouter.post("/register", (req, res) => {
  const { email, password, user_type, vendor_type, transport_type } = req.body;

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

      bcrypt.hash(password, 10, (hashError, hashedPassword) => {
        if (hashError) {
          console.error("Error hashing password:", hashError);
          return res.status(500).json({ error: "Error hashing password" });
        }

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
                      .json({
                        message: "User registered successfully",
                        userId,
                      });
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
                    console.log(userId);
                    res.status(201).json({
                      message: "User registered successfully",
                      userId
                    });
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
                              return res.status(500).json({
                                error: "Error inserting hotel vendor data",
                              });
                            }
                            res.status(201).json({
                              message: "User registered successfully",
                              userId
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
                                .json({
                                  error: "Error inserting transport data",
                                });
                            }

                            if (
                              !transportInsertResult ||
                              !transportInsertResult.insertId
                            ) {
                              return res
                                .status(500)
                                .json({
                                  error: "Failed to insert transport data",
                                });
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
                                      return res.status(500).json({
                                        error: "Error inserting airline data",
                                      });
                                    }
                                    res.status(200).json({
                                      message: "User registered successfully",
                                      transportId
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
                                      return res.status(500).json({
                                        error: "Error inserting railway data",
                                      });
                                    }
                                    res.status(200).json({
                                      message: "User registered successfully",
                                      transportId
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
                                      return res.status(500).json({
                                        error: "Error inserting bus data",
                                      });
                                    }
                                    res.status(200).json({
                                      message: "User registered successfully",
                                      transportId
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
                          }
                        );
                        break;
                      default:
                        res.status(400).json({ error: "Invalid vendor type" });
                        break;
                    }
                  }
                );
                break;
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

AuthRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    if (email === adminUsername && password === adminPassword) {
      const adminToken = jwt.sign({ email: adminUsername }, 'safarnama_admin', {
        expiresIn: '1h',
      });
      return res.status(200).json({ isAdmin: true, token: adminToken });
    }

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

        if (user.user_type === 'Guide') {
          pool.query(
            'SELECT guide_id FROM guides WHERE user_id = ?',
            [user.user_id],
            async (guideError, guideResults) => {
              if (guideError) {
                console.error('Error fetching guide_id:', guideError);
                return res.status(500).send('Error fetching guide_id');
              }

              if (!guideResults || guideResults.length === 0) {
                console.log('Guide not found for user:', email);
                return res.status(401).json({ error: 'Guide not found' });
              }

              const guideId = guideResults[0].guide_id;

              pool.query(
                'SELECT guide_application_id FROM guide_application WHERE guide_id = ?',
                [guideId],
                async (appError, appResults) => {
                  if (appError) {
                    console.error('Error fetching guide_application_id:', appError);
                    return res.status(500).send('Error fetching guide_application_id');
                  }

                  if (!appResults || appResults.length === 0) {
                    console.log('Guide application not found for user:', email);
                    return res.status(401).json({ error: 'Guide application not found' });
                  }

                  const guideAppId = appResults[0].guide_application_id;

                  pool.query(
                    'SELECT status FROM guide_application WHERE guide_application_id = ?',
                    [guideAppId],
                    async (statusError, statusResults) => {
                      if (statusError) {
                        console.error('Error fetching status:', statusError);
                        return res.status(500).send('Error fetching status');
                      }

                      if (!statusResults || statusResults.length === 0) {
                        console.log('Status not found for user:', email);
                        return res.status(401).json({ error: 'Status not found' });
                      }

                      const status = statusResults[0].status;

                      if (status !== 'active') {
                        console.log('Guide status is not active for user:', email);
                        return res.status(401).json({ error: 'Guide status is not active' });
                      }

                      const isPasswordMatch = true; 

                      if (!isPasswordMatch) {
                        console.log('Incorrect password for user:', email);
                        return res.status(401).json({ error: 'Incorrect password' });
                      }

                      const token = jwt.sign(
                        { userId: user.user_id, email: user.email },
                        'safarnama',
                        {
                          expiresIn: '6h',
                        }
                      );

                      res.status(201).json({ user, token });
                    }
                  );
                }
              );
            }
          );
        } else if (user.user_type === 'Vendor') {
          pool.query(
            'SELECT vendor_id, vendor_type FROM vendors WHERE user_id = ?',
            [user.user_id],
            async (vendorError, vendorResults) => {
              if (vendorError) {
                console.error('Error fetching vendor type:', vendorError);
                return res.status(500).send('Error fetching vendor type');
              }
              
              if (!vendorResults || vendorResults.length === 0) {
                console.log('Vendor not found for user:', email);
                return res.status(401).json({ error: 'Vendor not found' });
              }
              
              const vendorType = vendorResults[0].vendor_type;
              const vendorId = vendorResults[0].vendor_id;
              console.log(vendorType)
              if (vendorType === 'Hotel') {
                const token = jwt.sign(
                  { userId: user.user_id, email: user.email },
                  'safarnama',
                  {
                    expiresIn: '1h',
                  }
                );

                return res.status(200).json({ user, isHotel: true, token });

              }else if (vendorType === 'Transport') {
                pool.query(
                  'SELECT * FROM transport WHERE vendor_id = ?',
                  [vendorId],
                  async (transportError, transportResults) => {
                    if (transportError) {
                      console.error('Error fetching transport:', transportError);
                      return res.status(500).send('Error fetching transport');
                    }

                    if (!transportResults || transportResults.length === 0) {
                      console.log('Transport not found for user:', email);
                      return res.status(401).json({ error: 'Transport not found' });
                    }

                    const transportType = transportResults[0].transport_type;

                    if (transportType === 'Airline' || transportType === 'Railway' || transportType === 'Bus') {
                      const token = jwt.sign(
                        { userId: user.user_id, email: user.email },
                        'safarnama',
                        {
                          expiresIn: '1h',
                        }
                      );
                      return res.status(200).json({ user, transportType, token });
                    } else {
                      return res.status(401).json({ error: 'Invalid transport type' });
                    }
                  }
                );
              }  else {
                return res.status(200).json({ user });
              }
            }
          );
        } 
        else {
          // For non-guide users, continue with password check and token generation
          const isPasswordMatch = true; // Placeholder for password check

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

          res.status(201).json({ user, token });
        }
      }
    );
  } catch (error) {
    console.error('Error authenticating user:', error);
    return res.status(500).json({ error: 'Error authenticating user' });
  }
});

AuthRouter.post("/guide_personal_details", async (req, res) => {
  const { fullName, age, email, address, phoneNumber, cnicNumber, userId } =
    req.body;
  try {
    pool.query(
      "SELECT guide_id FROM guides WHERE user_id = ?",
      [userId],
      (guideIdError, guideIdResults) => {
        if (guideIdError) {
          console.error("Error fetching guideId:", guideIdError);
          return res.status(500).json({ error: "Error fetching guideId" });
        }

        if (guideIdResults.length === 0) {
          return res.status(404).json({ error: "Guide not found" });
        }

        const guideId = guideIdResults[0].guide_id;

        const insertQuery = `
        INSERT INTO guide_personal_details (guide_id, name, age, email, address, contact_number, cnic_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
        const insertValues = [
          guideId,
          fullName,
          age,
          email,
          address,
          phoneNumber,
          cnicNumber,
          guideId,
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
          .json({ message: "User registered successfully", guideId });
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

AuthRouter.post("/guide_submit_documents", async (req, res) => {
  const { image1, image2, image3, image4, guideId } = req.body;

  try {
    const insertQuery = `UPDATE guide_personal_details 
    SET picture = ?, cnic_front_picture = ?, cnic_back_picture = ?, guide_license_picture = ?
    WHERE guide_id = ?
  `;
    const insertValues = [image1, image2, image3, image4, guideId];

    pool.query(insertQuery, insertValues, (insertError) => {
      if (insertError) {
        console.error("Error inserting guide personal details:", insertError);
        return res.status(500).json({ error: "Error inserting data" });
      }
    });
    res.status(200).json({ message: "User registered successfully", guideId });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

AuthRouter.post("/guide_experience", async (req, res) => {
  const { experience, motivation, guideId } = req.body;

  try {
    const insertQuery = `INSERT INTO guide_application (guide_id, past_experience, motivation) VALUES (?, ?, ?)`;
    const insertValues = [guideId, experience, motivation];

    pool.query(insertQuery, insertValues, (insertError, insertResults) => {
      if (insertError) {
        console.error("Error inserting guide experience:", insertError);
        return res.status(500).json({ error: "Error inserting data" });
      }

      res.status(200).json({ message: "Guide experience submitted successfully", guideApplicationId: insertResults.insertId });
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

AuthRouter.post("/guide_bank_details", async (req, res) => {
  const { guideId, accountName, ibanNumber } = req.body;

  try {
    const updateQuery = `UPDATE guide_application 
      SET bank_account_title = ?, bank_account_number = ?
      WHERE guide_id = ?`;
    const updateValues = [accountName, ibanNumber, guideId];

    pool.query(updateQuery, updateValues, (updateError) => {
      if (updateError) {
        console.error("Error updating guide bank details:", updateError);
        return res.status(500).json({ error: "Error updating data" });
      }

      res.status(200).json({ message: "Guide bank details updated successfully" });
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

AuthRouter.post('/guide_questionnaire', async (req, res) => {
  const { guideId, answers } = req.body;

  try {
    const updateQuery = `
      UPDATE guide_application 
      SET guideq1 = ?, guideq2 = ?, guideq3 = ?
      WHERE guide_id = ?`;

    const updateValues = [
      answers[0] || null,
      answers[1] || null,
      answers[2] || null,
      guideId
    ];

    pool.query(updateQuery, updateValues, (updateError) => {
      if (updateError) {
        console.error("Error updating guide questionnaire:", updateError);
        return res.status(500).json({ error: "Error updating data" });
      }

      res.status(200).json({ message: "Guide questionnaire updated successfully" });
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

AuthRouter.post("/airline_details", async (req, res) => {
  const { fullName, email, phoneNumber, transportId } =
    req.body;
  console.log(transportId);
  try {
    pool.query(
      "SELECT airline_id FROM airline_transport WHERE transport_id  = ?",
      [transportId],
      (airlineIdError, airlineIdResults) => {
        if (airlineIdError) {
          console.error("Error fetching guideId:", airlineIdError);
          return res.status(500).json({ error: "Error fetching guideId" });
        }

        if (airlineIdResults.length === 0) {
          return res.status(404).json({ error: "airline not found not found" });
        }

        const airlineId = airlineIdResults[0].airline_id;

        const insertQuery = `
        INSERT INTO airline_details (airline_id, name, email, contact_number)
        VALUES (?, ?, ?, ?)
      `;
        const insertValues = [
          airlineId,
          fullName,
          email,
          phoneNumber,
        ];

        pool.query(insertQuery, insertValues, (insertError, insertResults) => {
          if (insertError) {
            console.error(
              "Error inserting airline details:",
              insertError
            );
            return res.status(500).json({ error: "Error inserting data" });
          }
        });
        res
          .status(200)
          .json({ message: "airline details added successfully", airlineId });
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

AuthRouter.post("/bus_details", async (req, res) => {
  const { fullName, email, phoneNumber, transportId } =
    req.body;
  console.log(transportId);
  try {
    pool.query(
      "SELECT bus_id FROM bus_transport WHERE transport_id  = ?",
      [transportId],
      (busIdError, busIdResults) => {
        if (airlineIdError) {
          console.error("Error fetching guideId:", busIdError);
          return res.status(500).json({ error: "Error fetching guideId" });
        }

        if (busIdResults.length === 0) {
          return res.status(404).json({ error: "bus not found not found" });
        }

        const busId = busIdResults[0].bus_id;

        const insertQuery = `
        INSERT INTO bus_details (bus_id, name, email, contact_number)
        VALUES (?, ?, ?, ?)
      `;
        const insertValues = [
          busId,
          fullName,
          email,
          phoneNumber,
        ];

        pool.query(insertQuery, insertValues, (insertError, insertResults) => {
          if (insertError) {
            console.error(
              "Error inserting bus details:",
              insertError
            );
            return res.status(500).json({ error: "Error inserting data" });
          }
        });
        res
          .status(200)
          .json({ message: "bus details added successfully", busId });
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

AuthRouter.post("/railway_details", async (req, res) => {
  const { fullName, email, phoneNumber, transportId } =
    req.body;
  console.log(transportId);
  try {
    pool.query(
      "SELECT railway_id FROM railway_transport WHERE transport_id  = ?",
      [transportId],
      (railwayIdError, railwayIdResults) => {
        if (railwayIdError) {
          console.error("Error fetching guideId:", railwayIdError);
          return res.status(500).json({ error: "Error fetching railwayId" });
        }

        if (railwayIdResults.railwaylength === 0) {
          return res.status(404).json({ error: "railway not found not found" });
        }

        const railwayId = railwayIdResults[0].bus_id;

        const insertQuery = `
        INSERT INTO railway_details (railway_id, name, email, contact_number)
        VALUES (?, ?, ?, ?)
      `;
        const insertValues = [
          railwayId,
          fullName,
          email,
          phoneNumber,
        ];

        pool.query(insertQuery, insertValues, (insertError, insertResults) => {
          if (insertError) {
            console.error(
              "Error inserting railway details:",
              insertError
            );
            return res.status(500).json({ error: "Error inserting data" });
          }
        });
        res
          .status(200)
          .json({ message: "railway details added successfully", railwayId });
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

AuthRouter.post("/hotel_vendor_personal_details", async (req, res) => {
  const { name, age, email, address, contact_number, cnic_number, picture, userId } = req.body;

  try {
    const vendorQuery = `
      SELECT vendor_id FROM vendors WHERE user_id = ?
    `;
    pool.query(vendorQuery, [userId], (vendorError, vendorResults) => {
      if (vendorError) {
        console.error("Error fetching vendor_id:", vendorError);
        return res.status(500).json({ error: "Error fetching vendor_id" });
      }

      if (vendorResults.length === 0) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      const vendor_id = vendorResults[0].vendor_id;

      const hotelQuery = `
        SELECT hotel_id FROM hotels WHERE vendor_id = ?
      `;
      pool.query(hotelQuery, [vendor_id], (hotelError, hotelResults) => {
        if (hotelError) {
          console.error("Error fetching hotel_id:", hotelError);
          return res.status(500).json({ error: "Error fetching hotel_id" });
        }

        if (hotelResults.length === 0) {
          return res.status(404).json({ error: "Hotel not found" });
        }

        const hotel_id = hotelResults[0].hotel_id;

        const insertQuery = `
          INSERT INTO hotel_vendor_personal_details (hotel_id, name, age, email, address, contact_number, cnic_number, picture)
          VALUES (?, ?, ?, ?, ?, ?, ?,?)
        `;
        const insertValues = [
          hotel_id,
          name,
          age,
          email,
          address,
          contact_number,
          cnic_number,
          picture,
        ];

        pool.query(insertQuery, insertValues, (insertError, insertResults) => {
          if (insertError) {
            console.error(
              "Error inserting personal details:",
              insertError
            );
            return res.status(500).json({ error: "Error inserting data" });
          }

          // If insertion is successful, send a success response
          res.status(200).json({ message: "Personal details registered successfully" });
        });
      });
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = AuthRouter;

const express = require("express");
const GuideRouter = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("./Db/db");
const jwt = require("jsonwebtoken");
const { promisify } = require('util');
const verifyAsync = promisify(jwt.verify);
const secretKey = 'safarnama';

GuideRouter.get('/guide-details', async (req, res) => {
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

    const guideIdQuery = 'SELECT guide_id FROM guides WHERE user_id = ?';

    pool.query(guideIdQuery, [userId], async (error, guideIdResults) => {
      if (error) {
        console.error('Error fetching guide ID:', error);
        return res.status(500).json({ error: 'Error fetching data' });
      }

      if (guideIdResults.length === 0) {
        return res.status(404).json({ error: 'Guide not found' });
      }

      const guideId = guideIdResults[0].guide_id;

      const guideDetailsQuery = `
        SELECT name, age, email, address, contact_number, cnic_number
        FROM guide_personal_details
        WHERE guide_id = ?
      `;

      pool.query(guideDetailsQuery, [guideId], (err, guideDetailsResults) => {
        if (err) {
          console.error('Error fetching guide details:', err);
          return res.status(500).json({ error: 'Error fetching data' });
        }

        if (guideDetailsResults.length === 0) {
          return res.status(404).json({ error: 'Guide personal details not found' });
        }

        const guidePersonalDetails = guideDetailsResults[0];
        res.status(200).json(guidePersonalDetails);
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


GuideRouter.post("/guide_personal_details", async (req, res) => {
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

GuideRouter.post("/guide_submit_documents", async (req, res) => {
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

GuideRouter.post("/guide_experience", async (req, res) => {
  const { experience, motivation, guideId } = req.body;

  try {
    const insertQuery = `INSERT INTO guide_application (guide_id, past_experience, motivation) VALUES (?, ?, ?)`;
    const insertValues = [guideId, experience, motivation];

    pool.query(insertQuery, insertValues, (insertError, insertResults) => {
      if (insertError) {
        console.error("Error inserting guide experience:", insertError);
        return res.status(500).json({ error: "Error inserting data" });
      }

      res.status(200).json({
        message: "Guide experience submitted successfully",
        guideApplicationId: insertResults.insertId,
      });
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

GuideRouter.post("/guide_bank_details", async (req, res) => {
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

      res
        .status(200)
        .json({ message: "Guide bank details updated successfully" });
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

GuideRouter.post("/guide_questionnaire", async (req, res) => {
  const { guideId, answers } = req.body;

  try {
    const updateQuery = `
        UPDATE guide_application 
        SET guide_q1 = ?, guide_q2 = ?, guide_q3 = ?
        WHERE guide_id = ?`;

    const updateValues = [
      answers[0] || null,
      answers[1] || null,
      answers[2] || null,
      guideId,
    ];

    pool.query(updateQuery, updateValues, (updateError) => {
      if (updateError) {
        console.error("Error updating guide questionnaire:", updateError);
        return res.status(500).json({ error: "Error updating data" });
      }

      res
        .status(200)
        .json({ message: "Guide questionnaire updated successfully" });
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

GuideRouter.get("/guide_applications", async (req, res) => {
  try {
    const { status } = req.query;
    let query;

    console.log(status);

    if (status === "Active") {
      query = `SELECT ga.*, gd.name AS guide_name, gd.picture AS guide_picture FROM guide_application AS ga INNER JOIN guide_personal_details AS gd ON ga.guide_id = gd.guide_id WHERE ga.status = 'active'`;
    } else if (status === "Pending") {
      query = `SELECT ga.*, gd.name AS guide_name , gd.picture AS guide_picture FROM guide_application AS ga INNER JOIN guide_personal_details AS gd ON ga.guide_id = gd.guide_id WHERE ga.status = 'pending'`;
    } else if (status === "Rejected") {
      query = `SELECT ga.*, gd.name AS guide_name , gd.picture  AS guide_picture FROM guide_application AS ga INNER JOIN guide_personal_details AS gd ON ga.guide_id = gd.guide_id WHERE ga.status = 'rejected'`;
    } else {
      return res.status(400).json({ error: "Invalid status parameter" });
    }

    pool.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching guide applications:", error);
        return res.status(500).json({ error: "Error fetching data" });
      }

      const usersObject = results.reduce((acc, user) => {
        acc[user.guide_id] = {
          ...user,
          guide_name: user.guide_name,
          guide_picture: user.guide_picture 
        };
        return acc;
      }, {});

      res.status(200).json(usersObject);
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

GuideRouter.put("/update_guide_status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== 'active' && status !== 'rejected') {
      return res.status(400).json({ error: 'Invalid status value. Must be "active" or "rejected".' });
    }

    const updateQuery = `UPDATE guide_application SET status = ? WHERE guide_id = ?`;
    const values = [status, id];

    pool.query(updateQuery, values, (error, results) => {
      if (error) {
        console.error('Error updating guide status:', error);
        return res.status(500).json({ error: 'Error updating guide status' });
      }

      res.status(200).json({ message: 'Guide status updated successfully' });
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = GuideRouter;

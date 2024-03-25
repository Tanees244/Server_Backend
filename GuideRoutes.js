const express = require("express");
const GuideRouter = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("./Db/db");
const jwt = require("jsonwebtoken");

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

      res
        .status(200)
        .json({
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

GuideRouter.get("/guide_details", async (req, res) => {
  try {
    const query = `SELECT * FROM guide_application`;

    pool.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching guide details:", error);
        return res.status(500).json({ error: "Error fetching data" });
      }

      if (!results || results.length === 0) {
        return res.status(404).json({ error: "No data found" });
      }

      res.status(200).json({ Results: results });
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = GuideRouter;

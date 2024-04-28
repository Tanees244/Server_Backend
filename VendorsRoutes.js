const express = require("express");
const VendorRouter = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("./Db/db");
const jwt = require("jsonwebtoken");
const { promisify } = require('util');
const verifyAsync = promisify(jwt.verify);
const secretKey = 'safarnama';

VendorRouter.get('/airline-details', async (req, res) => {
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
  
      // Fetch vendor_id from vendors table using user_id
      const vendorIdQuery = 'SELECT vendor_id FROM vendors WHERE user_id = ?';
      pool.query(vendorIdQuery, [userId], async (error, vendorIdResults) => {
        if (error) {
          console.error('Error fetching vendor ID:', error);
          return res.status(500).json({ error: 'Error fetching data' });
        }
  
        if (vendorIdResults.length === 0) {
          return res.status(404).json({ error: 'Vendor not found' });
        }
  
        const vendorId = vendorIdResults[0].vendor_id;
        console.log(vendorId)
        // Fetch transport_id from transport table using vendor_id
        const transportIdQuery = 'SELECT transport_id FROM transport WHERE vendor_id = ?';
        pool.query(transportIdQuery, [vendorId], async (error, transportIdResults) => {
          if (error) {
            console.error('Error fetching transport ID:', error);
            return res.status(500).json({ error: 'Error fetching data' });
          }
  
          if (transportIdResults.length === 0) {
            return res.status(404).json({ error: 'Transport not found' });
          }
  
          const transportId = transportIdResults[0].transport_id;
          console.log(transportId)
          // Fetch airline_id from airline_transport table using transport_id
          const airlineIdQuery = 'SELECT airline_id FROM airline_transport WHERE transport_id = ?';
          pool.query(airlineIdQuery, [transportId], async (error, airlineIdResults) => {
            if (error) {
              console.error('Error fetching airline ID:', error);
              return res.status(500).json({ error: 'Error fetching data' });
            }
  
            if (airlineIdResults.length === 0) {
              return res.status(404).json({ error: 'Airline not found' });
            }
  
            const airlineId = airlineIdResults[0].airline_id;
            console.log(airlineId)
            // Fetch airline details from airline_details table using airline_id
            const airlineDetailsQuery = `
              SELECT * FROM airline_details WHERE airline_id = ?
            `;
            pool.query(airlineDetailsQuery, [airlineId], (err, airlineDetailsResults) => {
              if (err) {
                console.error('Error fetching airline details:', err);
                return res.status(500).json({ error: 'Error fetching data' });
              }
  
              if (airlineDetailsResults.length === 0) {
                return res.status(404).json({ error: 'Airline details not found' });
              }
  
              const airlineDetails = airlineDetailsResults[0];
              res.status(200).json(airlineDetails);
            });
          });
        });
      });
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = VendorRouter;

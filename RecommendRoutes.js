// const express = require("express");
// const RecommendRouter = express.Router();
// const axios = require('axios');
// const bodyParser = require('body-parser');
// const cors = require('cors');

// const PORT = process.env.PORT || 8000;

// RecommendRouter.use(bodyParser.json());
// RecommendRouter.use(cors());

// RecommendRouter.post('/api/hotels', async (req, res) => {
//     try {
//         const userPreferences = req.body;
//         const response = await axios.post('http://127.0.0.1:5000/api/recommendations', userPreferences);
//         console.log(response.data);
//         res.json(response.data);
//     } catch (error) {
//         console.error('Error fetching recommendations:', error);
//         res.status(500).send('Error fetching recommendations');
//     }
// });

// module.exports = RecommendRouter;

const express = require("express");
const RecommendRouter = express.Router();
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const PORT = process.env.PORT || 8000;

RecommendRouter.use(bodyParser.json());
RecommendRouter.use(cors());

RecommendRouter.post('/recommend', async (req, res) => {
    try {
        // Extract package data and preference from the request body
        const { packages, preferences } = req.body;

        // Extract package IDs
        const packageIds = packages.map(packageItem => packageItem.package_id);

        // Send package IDs and preference to Flask backend for recommendation
        const response = await axios.post('http://127.0.0.1:5000/api/recommend', { package_ids: packageIds, preferences });

        // Return recommendations received from Flask backend
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).send('Error fetching recommendations');
    }
});

RecommendRouter.post('/details', async (req, res) => {
    try {
        // Extract package IDs from the request body
        const { package_ids } = req.body;

        // Fetch details of all packages based on their IDs
        const packageDetailsPromises = package_ids.map(async packageId => {
            const response = await axios.get(`http://192.168.100.12:8000/api/routes/packages/${packageId}`);
            return response.data;
        });

        // Wait for all package details to be fetched
        const packageDetails = await Promise.all(packageDetailsPromises);

        // Return package details
        res.json(packageDetails);
    } catch (error) {
        console.error('Error fetching package details:', error);
        res.status(500).send('Error fetching package details');
    }
});


module.exports = RecommendRouter;
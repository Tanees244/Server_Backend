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
        // Extract package data from the request body
        const packagesData = req.body.packages;

        // Extract package_id, preference, and rating for each package
        const packageFields = packagesData.map(packageItem => {
            const { package_id, preference, rating } = packageItem;
            return { package_id, preference, rating };
        });

        // Send package data to Flask backend
        const response = await axios.post('http://127.0.0.1:5000/api/recommend', { packages: packageFields });

        // Return recommendations received from Flask backend
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).send('Error fetching recommendations');
    }
});

module.exports = RecommendRouter;

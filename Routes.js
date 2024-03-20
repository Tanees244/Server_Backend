const express = require('express');
const router = express.Router();
const pool = require('./Db/db');

router.get('/places', (req, res) => {
    pool.query('SELECT * from places', (error, results, feilds) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).send('Error fetching data');
            return;
        }
        res.json(results);
    });
});



module.exports = router;
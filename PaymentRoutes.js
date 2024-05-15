
const express = require("express");
const PaymentRouter = express.Router();
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const pool = require("./Db/db");
const verifyAsync = promisify(jwt.verify);
const secretKey = "safarnama";
const Stripe = require('stripe');
const stripeTestKey = 'sk_test_51N4iDhKsAkXEeSiVqEfft0vWzbopukgiaprsTk3OW0mRE47twHbQKCI5eEwLuQPWZNBkg25SlnS5O7QbG0z8Kszm00eGvxfk71'; // Replace this with your actual Stripe secret key
const stripe = new Stripe(stripeTestKey, {
    apiVersion: '2022-11-15',
    typescript: true,
});

PaymentRouter.post('/payment-intent', async (req, res) => {
    const { email, amount } = req.body;
    console.log(amount, email)

    try {
        if (!email) {
            return res.status(400).json({ error: "Email not provided for customer" });
        }
        if (!amount) {
            return res.status(400).json({ error: "Amount not provided for customer" });
        }

        const customers = await stripe.customers.list({ email });
        const customer = customers.data[0];
        
        if (!customer) {
            const newCustomer = await stripe.customers.create({ email });
            const ephemeralKey = await stripe.ephemeralKeys.create(
                { customer: newCustomer.id },
                { apiVersion: '2022-11-15' },
            );
            const paymentIntent = await stripe.paymentIntents.create({
                customer: newCustomer.id,
                receipt_email: email,
                currency: 'pkr',
                amount: amount,
                payment_method_types: ['card', 'link'],
            });
            return res.json({
                paymentIntent: paymentIntent.client_secret,
                ephemeralKey: ephemeralKey.secret,
                customer: newCustomer.id,
            });
        }

        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customer.id },
            { apiVersion: '2022-11-15' },
        );
        const paymentIntent = await stripe.paymentIntents.create({
            customer: customer.id,
            receipt_email: email,
            currency: 'pkr',
            amount: amount,
            payment_method_types: ['card', 'link'],
        });
        console.log('hello');
        return res.json({
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

PaymentRouter.get("/user-packages", async (req, res) => {
    const authToken = req.headers.authorization;

    if (!authToken) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // Extract the token from the Authorization header
        const token = authToken.split(" ")[1];
        
        // Verify the token to get the user ID
        const decodedToken = await verifyAsync(token, secretKey);

        if (!decodedToken || !decodedToken.userId) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // Get the user ID from the decoded token
        const userId = decodedToken.userId;
        console.log("User: ",userId);

        // Query to fetch the tourist ID corresponding to the user ID
        const touristIdQuery = "SELECT tourist_id FROM tourists WHERE user_id = ?";

        // Execute the query to get the tourist ID
        pool.query(touristIdQuery, [userId], async (error, results) => {
            if (error) {
                console.error("Error fetching tourist ID:", error);
                return res.status(500).json({ error: "Error fetching data" });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: "Tourist ID not found for the user" });
            }

            const touristId = results[0].tourist_id;
            console.log("Tousrist ID : ", touristId)

            // Query to fetch all package IDs corresponding to the tourist ID
            const packageIdsQuery = "SELECT package_id FROM booked_packages WHERE tourist_id = ?";

            // Execute the query to get all package IDs for the tourist
            pool.query(packageIdsQuery, [touristId], (error, packageResults) => {
                if (error) {
                    console.error("Error fetching package IDs:", error);
                    return res.status(500).json({ error: "Error fetching data" });
                }

                // Extract the package IDs from the result
                const packageIds = packageResults.map(row => row.package_id);

                if (packageIds.length === 0) {
                    return res.status(200).json([]); // No packages found for the tourist
                }

                // Query to fetch prices of packages based on their IDs
                const pricesQuery = "SELECT package_id, price FROM packages WHERE package_id IN (?)";

                // Execute the query to get prices for the package IDs
                pool.query(pricesQuery, [packageIds], (error, priceResults) => {
                    if (error) {
                        console.error("Error fetching prices:", error);
                        return res.status(500).json({ error: "Error fetching data" });
                    }
                    const totalPrice2 = priceResults.reduce((total, row) => total + row.price, 0);

                    // Send the total price in the response'
                    console.log(totalPrice2);
                    res.status(200).json({ totalPrice2 });
                });
            });
        });
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = PaymentRouter;
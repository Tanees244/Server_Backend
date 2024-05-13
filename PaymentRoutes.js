
const express = require("express");
const PaymentRouter = express.Router();
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

module.exports = PaymentRouter;
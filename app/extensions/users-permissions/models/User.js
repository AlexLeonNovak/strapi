'use strict';

const api_key = strapi.config.get('stripe.api_key');
const slack_webhook_url = strapi.config.get('server.slack_webhook_url');
const stripe = require('stripe')(api_key);

/**
 * Lifecycle callbacks for the `User` model.
 */

module.exports = {
    lifecycles: {
        /**
         * Triggered before user creation.
         */
        beforeCreate: async model => {
            // Check if user_type is realtor
            if (model.user_type == "realtor") {
                // Create a new customer object
                const customer = await stripe.customers.create({
                    name: model.name,
                    email: model.email,
                    phone: model.phone_number
                    // phone: model.
                });

                console.log(`
                    Stripe customer created for:

                    Name: ${customer.name}
                    Email: ${customer.email}
                    Phone: ${customer.phone}
                    Stripe Customer ID: ${customer.id}
                `)

                // save the customer.id as stripeCustomerId
                // in your database.
                model.stripe_customer_id = customer.id
            }
        },

        /**
         * Triggerred after user creation.
         */
        afterCreate: async model => {

            const axios = require('axios').default;

            const text = [
                'Environment: ' + process.env.PUBLIC_URL,
                'Event: New Signup',
                'Name: ' + model.name,
                'Email: ' + model.email,
                'Stripe Customer ID: ' + model.stripe_customer_id,
                'User Type: ' + model.user_type,
                'Signup Host: ' + model.signup_host
            ].join('\n')


            const data = { text: text };

            console.log(`
                ${data.text}
            `)

            axios.post(slack_webhook_url, data)
                .then(function (response) {
                    // console.log(response);
                })
                .catch(function (error) {
                    console.log(error);
                });
        },
    }
};


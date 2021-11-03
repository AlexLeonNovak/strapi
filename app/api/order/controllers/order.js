"use strict";

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

const api_key = strapi.config.get("stripe.api_key");
const stripe = require("stripe")(api_key);
const leagent_card_price_id = "price_1JXXAuLp1nxKMrVwZUKxPfuN";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  /**
   * Create a subscription.
   *
   * @return {Object}
   */
  async createSubscription(ctx) {
    // console.log(ctx.request.body)
    // const { customerId, paymentMethodId, priceId } = ctx.request.body;
    const req = ctx.request;

    // Attach the payment method to the customer
    let paymentMethod;
    try {
      paymentMethod = await stripe.paymentMethods.attach(
        req.body.paymentMethodId,
        {
          customer: req.body.customerId,
        }
      );
    } catch (error) {
      // return ctx.status('402').send({ error: { message: error.message } });
      return ctx.send({ error: { message: error.message } });
    }

    // Change the default invoice settings on the customer to the new payment method
    await stripe.customers.update(req.body.customerId, {
      invoice_settings: {
        default_payment_method: req.body.paymentMethodId,
      },
      address: paymentMethod.billing_details.address,
      metadata: {
        userId: req.body.userId,
      },
    });

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: req.body.customerId,
      items: [{ price: req.body.priceId }],
      expand: ["latest_invoice.payment_intent"],
      trial_period_days: 30,
      add_invoice_items: [
        {
          price: leagent_card_price_id,
        },
      ],
      default_tax_rates: [
        "txr_1H4V8kLp1nxKMrVwQtoGrVbp",
        "txr_1H4V99Lp1nxKMrVwykWTY1PK",
      ],
    });

    strapi.query("user", "users-permissions").update(
      { id: req.body.userId },
      {
        stripe_subscription_id: subscription.id,
        current_period_end: new Date(subscription.current_period_end * 1000),
        stripe_price_id: subscription.items.data[0].plan.id,
        stripe_subscription_status: subscription.status,
      }
    );

    ctx.send(subscription);
  },

  /**
   * Webhook to handle Stripe events
   *
   * @return {Object}
   */
  async webhook(ctx) {
    const request = ctx.request;
    let event;

    try {
      event = request.body;
    } catch (err) {
      return ctx.throw(400, `Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log(`
          Webhook Received: payment_intent.succeeded
        `);
        // Then define and call a method to handle the successful payment intent.
        handlePaymentIntentSucceeded(paymentIntent);
        break;
      case "payment_method.attached":
        const paymentMethod = event.data.object;
        console.log(`
          Webhook Received: payment_method.attached
        `);
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
      // ... handle other event types
      default:
        console.log(`
          Unhandled event type ${event.type}
        `);
    }

    // Return a response to acknowledge receipt of the event
    ctx.send({ received: true });
  },
};

function handlePaymentIntentSucceeded(paymentIntent) {
  gi;
  strapi.query("user", "users-permissions").update(
    { stripe_customer_id: paymentIntent.customer },
    {
      stripe_subscription_status: "active",
    }
  );
}

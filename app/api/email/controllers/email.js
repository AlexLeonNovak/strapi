const providerOptions = strapi.config.get("plugins.email.providerOptions");

const AWS_SES_KEY = providerOptions.key;
const AWS_SES_SECRET = providerOptions.secret;

var ses = require("node-ses"),
  client = ses.createClient({
    key: AWS_SES_KEY,
    secret: AWS_SES_SECRET,
    amazon: "https://email.us-west-2.amazonaws.com",
  });

module.exports = {
  // GET /hello
  async send(ctx) {
    const { to, replyTo, subject, html, text } = ctx.request.body;
    // Give SES the details and let it construct the message for you.
    client.sendEmail(
      {
        to: to,
        from: "Leagent <team@leagent.com>",
        replyTo: replyTo,
        subject: subject,
        message: html,
        altText: text,
      },
      function (err, data, res) {
        if (!!err) {
          ctx.throw(400, err);
        }
      }
    );
    ctx.send({ message: "email sent" });
  },

  async sendTemplatedEmail(ctx) {
    try {
      const { to, replyTo, listings, saved_search_id } = ctx.request.body;

      console.log(ctx.request.body);

      const user = await strapi
        .query("user", "users-permissions")
        .findOne({ email: to });
      await strapi.plugins["email-designer"].services.email.sendTemplatedEmail(
        {
          to: to, // required
          from: "Leagent <team@leagent.com>", // optional if /config/plugins.js -> email.settings.defaultFrom is set
          replyTo: replyTo, // optional if /config/plugins.js -> email.settings.defaultReplyTo is set
          attachments: [], // optional array of files
        },
        {
          templateId: 2, // required - you can get the template id from the admin panel (can change on import)
          sourceCodeToTemplateId: 22, // ID that can be defined in the template designer (won't change on import)
          // subject: subject, // If provided here will override the template's subject. Can include variables like `Thank you for your order {{= user.firstName }}!`
        },
        {
          // this object must include all variables you're using in your email template
          USER: {
            name: user.name,
          },
          // order: {
          //   products: [
          //     { name: "Article 1", price: 9.99 },
          //     { name: "Article 2", price: 5.55 },
          //   ],
          // },
          // shippingCost: 5,
          // total: 20.54,
          listings: listings,
        }
      );
      ctx.send({ message: "email sent" });

      strapi.services["saved-search"].update(
        { id: saved_search_id },
        { Last_email: Date.now() }
      );
    } catch (err) {
      strapi.log.debug("📺: ", err);
      return ctx.badRequest(null, err);
    }
  },
};

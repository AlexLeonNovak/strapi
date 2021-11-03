module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'dc22b5299f42021045c0a83e4771ddf7'),
    },
  },
  slack_webhook_url: env('SLACK_WEBHOOK_URL', 'https://hooks.slack.com/services/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')
});

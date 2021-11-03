module.exports = ({ env }) => ({
  api_key: env("STRIPE_API_KEY"),
});

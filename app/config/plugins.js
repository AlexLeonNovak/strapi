module.exports = ({ env }) => ({
    // ...
    email: {
        provider: 'amazon-ses',
        providerOptions: {
            key: env('AWS_SES_KEY'),
            secret: env('AWS_SES_SECRET'),
            amazon: 'https://email.us-west-2.amazonaws.com',
        },
        settings: {
            defaultFrom: 'Leagent <team@leagent.com>',
            defaultReplyTo: 'Leagent <team@leagent.com>',
        },
    },
    graphql: {
        playgroundAlways: true,
    },
});
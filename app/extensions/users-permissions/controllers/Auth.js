'use strict';

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const crypto = require('crypto');
const { sanitizeEntity } = require('strapi-utils');

const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

module.exports = {
    async customForgotPassword(ctx) {
        console.log("customForgotPassword() called")
        let { email, client_url } = ctx.request.body;

        // Check if the provided email is valid or not.
        const isEmail = emailRegExp.test(email);

        if (isEmail) {
            email = email.toLowerCase();
        } else {
            return ctx.badRequest(
                null,
                formatError({
                    id: 'Auth.form.error.email.format',
                    message: 'Please provide valid email address.',
                })
            );
        }

        const pluginStore = await strapi.store({
            environment: '',
            type: 'plugin',
            name: 'users-permissions',
        });

        // Find the user by email.
        const user = await strapi
            .query('user', 'users-permissions')
            .findOne({ email: email.toLowerCase() });

        // User not found.
        if (!user) {
            return ctx.badRequest(
                null,
                formatError({
                    id: 'Auth.form.error.user.not-exist',
                    message: 'This email does not exist.',
                })
            );
        }

        // Generate random token.
        const resetPasswordToken = crypto.randomBytes(64).toString('hex');

        const settings = await pluginStore.get({ key: 'email' }).then(storeEmail => {
            try {
                return storeEmail['reset_password'].options;
            } catch (error) {
                return {};
            }
        });

        // This is where we get the URL from Advance Settings to insert into password reset email
        const advanced = await pluginStore.get({
            key: 'advanced',
        });

        const userInfo = sanitizeEntity(user, {
            model: strapi.query('user', 'users-permissions').model,
        });

        settings.message = await strapi.plugins['users-permissions'].services.userspermissions.template(
            settings.message,
            {
                // URL: advanced.email_reset_password, // commented this out so URL is dynamic
                URL: client_url,
                USER: userInfo,
                TOKEN: resetPasswordToken,
            }
        );

        settings.object = await strapi.plugins['users-permissions'].services.userspermissions.template(
            settings.object,
            {
                USER: userInfo,
            }
        );

        try {
            // Send an email to the user.
            await strapi.plugins['email'].services.email.send({
                to: user.email,
                from:
                    settings.from.email || settings.from.name
                        ? `${settings.from.name} <${settings.from.email}>`
                        : undefined,
                replyTo: settings.response_email,
                subject: settings.object,
                text: settings.message,
                html: settings.message,
            });
        } catch (err) {
            return ctx.badRequest(null, err);
        }

        // Update the user.
        await strapi.query('user', 'users-permissions').update({ id: user.id }, { resetPasswordToken });

        ctx.send({ ok: true });
    },
};
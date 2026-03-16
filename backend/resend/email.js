import { resend } from "./config.js";
import {
    verificationTokenEmailTemplate,
    WELCOME_EMAIL_TEMPLATE,
    PASSWORD_RESET_EMAIL_TEMPLATE,
} from "./email-template.js";

const SENDER = "NutriAi <onboarding@resend.dev>";

export const sendVerificationEmail = async (email, verificationToken) => {
    await resend.emails.send({
        from:    SENDER,
        to:      email,
        subject: "Verify your NutriAi email address",
        html:    verificationTokenEmailTemplate.replace("{verificationToken}", verificationToken),
    });
};

export const sendWelcomeEmail = async (email, name) => {
    await resend.emails.send({
        from:    SENDER,
        to:      email,
        subject: `Welcome to NutriAi, ${name}! 🎉`,
        html:    WELCOME_EMAIL_TEMPLATE.replace("{name}", name),
    });
};

export const sendPasswordResetEmail = async (email, resetURL) => {
    await resend.emails.send({
        from:    SENDER,
        to:      email,
        subject: "Reset your NutriAi password",
        html:    PASSWORD_RESET_EMAIL_TEMPLATE.replace(/{resetURL}/g, resetURL),
    });
};
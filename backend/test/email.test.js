const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { sendEmail } = require('../utils/email');

const SMTP_KEYS = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];

test('unconfigured SMTP skips notification without attempting localhost delivery', async () => {
  const previous = Object.fromEntries(SMTP_KEYS.map((key) => [key, process.env[key]]));
  const createTransport = nodemailer.createTransport;
  let transporterCreated = false;

  try {
    SMTP_KEYS.forEach((key) => delete process.env[key]);
    nodemailer.createTransport = () => {
      transporterCreated = true;
      throw new Error('should not create a transport');
    };

    assert.equal(await sendEmail({ to: 'test@example.invalid', subject: 'test', html: '' }), false);
    assert.equal(transporterCreated, false);
  } finally {
    nodemailer.createTransport = createTransport;
    SMTP_KEYS.forEach((key) => {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    });
  }
});

test('SMTP delivery failure is swallowed so notification cannot reject the main flow', async () => {
  const previous = Object.fromEntries(SMTP_KEYS.map((key) => [key, process.env[key]]));
  const createTransport = nodemailer.createTransport;

  try {
    process.env.EMAIL_HOST = 'smtp.test.invalid';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'test-user';
    process.env.EMAIL_PASS = 'test-password';
    nodemailer.createTransport = () => ({ sendMail: async () => { throw new Error('smtp rejected'); } });

    assert.equal(await sendEmail({ to: 'test@example.invalid', subject: 'test', html: '' }), false);
  } finally {
    nodemailer.createTransport = createTransport;
    SMTP_KEYS.forEach((key) => {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    });
  }
});

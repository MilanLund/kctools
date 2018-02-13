const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Mailgun',
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASSWORD
  }
});

/**
 * GET /contact
 * Contact form page.
 */
exports.getContact = (req, res) => {
  res.render('contact', {
    title: 'Contact',
	 isWebsite: true
  });
};

/**
 * POST /contact
 * Send a contact form via Nodemailer.
 */
exports.postContact = (req, res) => {
  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('message', 'Message cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/feedback');
  }

  const name = req.sanitize('name').trim(),
  email = req.sanitize('email').trim(),
  message = req.sanitize('message').trim();

  const mailOptions = {
    to: 'hello@milanlund.com',
    from: `${name} <${email}>`,
    subject: 'Feedback Form | Kentico Cloud Tools',
    text: message
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      req.flash('errors', { msg: err.message });
      return res.redirect('/feedback');
    }
    req.flash('success', { msg: 'Email has been sent successfully!' });
    res.redirect('/feedback');
  });
};

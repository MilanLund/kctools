const User = require('../models/User');

/**
 * GET /set/:id
 * Home page.
 */
exports.getSetActiveProject = (req, res, next) => {
	User.findById(req.user.id, (err, user) => {
		user.activeProject = req.sanitize('id').trim();
		user.save((err) => {
			if (err) {
				return next(err);
			}
		});
		let backURL = req.header('Referer') || '/';
		res.redirect(backURL);
	});
};
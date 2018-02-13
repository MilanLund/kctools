/**
 * GET /dashboard
 * Home page.
 */
exports.getDashboard = (req, res) => {
	res.render('dashboard', {
		title: 'Dashboard'
	 });
 };
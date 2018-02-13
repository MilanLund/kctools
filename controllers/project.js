/**
 * GET /projects
 * List all projects.
 */
const Project = require('../models/Project.js');
const User = require('../models/User');
const request = require('request');

exports.getProjects = (req, res, next) => {
	Project.find({
		userID: req.user._id
	}, (err, docs) => {
		res.render('projects', {
			title: 'Projects',
			projects: docs
		});
		return null;
	});
};

/**
 * GET /projects/:id
 * Project form page.
 */
exports.getProject = (req, res, next) => {
	let id = req.sanitize('id').trim();

	if (id === 'new') {
		Project.findOne({
			userID: req.user._id
		}, (err, existingProject) => {
			let title = '';
			if (err) {
				return next(err);
			}
			if (!existingProject) {
				title = 'Add your first project';
			} else {
				title = 'Add a project';
			}
			res.render('project/form', {
				title: title
			});
		});
	} else {
		Project.findOne({
			_id: id,
			userID: req.user._id
		}, (err, existingProject) => {
			if (err || !existingProject) {
				req.flash('errors', {
					msg: 'There is no project to be edited.'
				});
				return res.redirect('/projects');
			}

			res.render('project/form', {
				title: 'Edit Project',
				name: existingProject.name,
				projectID: existingProject.projectID 
			});	
		});
	}
};

/**
 * POST /projects/:id
 * Add/edit project.
 */
exports.postProject = (req, res, next) => {
	let id = req.sanitize('id').trim();

	req.assert('name', 'Name cannot be blank').notEmpty();
	req.assert('projectID', 'Project ID cannot be blank').notEmpty();

	const errors = req.validationErrors();

	if (errors) {
		req.flash('errors', errors);
		return res.redirect(`/projects/${id}`);
	}

	const name = req.sanitize('name').trim(),
		projectID = req.sanitize('projectID').trim();

	const project = new Project({
		name: name,
		projectID: projectID,
		userID: req.user._id
	});

	Project.findOne({
		projectID: projectID,
		userID: req.user._id
	}, (err, existingProject) => {
		if (err) {
			return next(err);
		}
		if (existingProject && id === 'new') {
			req.flash('errors', {
				msg: 'Project with the same Project ID is already added to your account.'
			});
			return res.redirect('/projects/new');
		}
		request(`https://deliver.kenticocloud.com/${projectID}/items`, {
			json: true
		}, (err, response, body) => {
			if (body.hasOwnProperty('error_code') || err) {
				req.flash('errors', {
					msg: 'Project ID does not stand for any Kentico Cloud project.'
				});
				return res.redirect(`/projects/${id}`);
			} else {
				if (!existingProject) {
					project.save((err, doc) => {
						if (err) {
							return next(err);
						}

						User.findById(req.user.id, (err, user) => {
							user.activeProject = doc._id;
							user.save((err) => {
								if (err) {
									return next(err);
								}
							});
							res.redirect(`/dashboard`);
						});	

					});
				} else {
					let upsertData = project.toObject();
					delete upsertData._id;
					Project.update({
						_id: id
					}, upsertData, {upsert: true}, (err) => {
						if (err) {
							return next(err);
						}
						req.flash('info', {
							msg: `Project ${upsertData.name} has been updated`
						});
						res.redirect(`/dashboard`);
					});
				}
			}
		});
	});
};

/**
 * GET /project/delete/:projectID
 * Delete project.
 */
exports.getDeleteProject = (req, res, next) => {
	let id = req.sanitize('id').trim();

	Project.findOne({
		_id: id,
		userID: req.user._id
	}, (err, existingProject) => {
		if (err || !existingProject) {
			req.flash('errors', {
				msg: 'There is no project to be deleted.'
			});
			return res.redirect('/projects');
		}
		Project.remove({
			_id: id
		}, (err) => {
			if (err) {
				return next(err);
			}
			req.flash('info', {
				msg: `The project ${existingProject.name} has been deleted.`
			});
			res.redirect('/projects');
		});
	});
};
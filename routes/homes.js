const express = require('express');
const router = express.Router();
const homes = require('../controllers/homes');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateHome } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const Home = require('../models/home');

router.route('/')
    .get(catchAsync(homes.index))
    .post(isLoggedIn, upload.array('image'), validateHome, catchAsync(homes.createHome))


router.get('/new', isLoggedIn, homes.renderNewForm)

router.route('/:id')
    .get(catchAsync(homes.showHome))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateHome, catchAsync(homes.updateHome))
    .delete(isLoggedIn, isAuthor, catchAsync(homes.deleteHome));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(homes.renderEditForm))



module.exports = router;
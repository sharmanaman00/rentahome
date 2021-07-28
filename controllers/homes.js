const Home = require('../models/home');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");


module.exports.index = async (req, res) => {
    const homes = await Home.find({}).populate('popupText');
    res.render('homes/index', { homes })
}

module.exports.renderNewForm = (req, res) => {
    res.render('homes/new');
}

module.exports.createHome = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.home.location,
        limit: 1
    }).send()
    const home = new Home(req.body.home);
    home.geometry = geoData.body.features[0].geometry;
    home.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    home.author = req.user._id;
    await home.save();
    console.log(home);
    req.flash('success', 'Successfully made a new House!');
    res.redirect(`/homes/${home._id}`)
}

module.exports.showHome = async (req, res,) => {
    const home = await Home.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!home) {
        req.flash('error', 'Cannot find that house!');
        return res.redirect('/homes');
    }
    res.render('homes/show', { home });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const home = await Home.findById(id)
    if (!home) {
        req.flash('error', 'Cannot find that house!');
        return res.redirect('/homes');
    }
    res.render('homes/edit', { home });
}

module.exports.updateHome = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);
    const home = await Home.findByIdAndUpdate(id, { ...req.body.home });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    home.images.push(...imgs);
    await home.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await home.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated house!');
    res.redirect(`/homes/${home._id}`)
}

module.exports.deleteHome = async (req, res) => {
    const { id } = req.params;
    await Home.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted house')
    res.redirect('/homes');
}
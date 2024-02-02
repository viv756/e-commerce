const Banner = require('../models/banner-model')
// const Product = require('../models/product-model')


const loadBanner = async (req, res) => {
    try {
        const currentPage = "/admin/banner";
        res.render('banner', { currentPage })
    } catch (error) {
        console.log(error.message)
    }
}


const createBanner = async (req, res) => {
    try {
        console.log(req.file);
        const { titleOne,titleTwo, titleThree,titleFour, link } = req.body;
        const bannerImage = req.file.filename;

        const newBanner = new Banner({
            titleOne,
            titleTwo,
            titleThree,
            titleFour,
            bannerImage: [bannerImage],
            link,
        });

        await newBanner.save();
        res.redirect('/admin/bannerList'); // Redirect to the banner page or handle it based on your needs
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const bannerList = async(req, res)=>{
    try{
        const currentPage = "/admin/banner";
        const data = await Banner.find()
        console.log('nann',data);
        res.render('bannerList',{data,currentPage})
    }catch(error){
        console.log(error.message)
    }
}

const editBannerPage = async(req, res)=>{
    try{
        
        const currentPage = "/admin/banner";
        const bannerId = req.params.id
        const banner = await Banner.findById({_id: bannerId})
        res.render('edit-banner',{banner, currentPage})
    }catch(error){
        console.log(error.message)
    }
}


const editBanner = async (req, res) => {
    try {
        const bannerId = req.params.id;
        console.log(bannerId, 'baaaa');
        const { titleOne, titleTwo,titleThree,titleFour, link } = req.body;

        const banner = await Banner.findById(bannerId);

        if (!banner) {
            return res.status(404).render('404');
        }

        banner.titleOne = titleOne;
        banner.titleTwo = titleTwo;
        banner.titleThree = titleThree;
        banner.titleFour = titleFour;
        banner.link = link;

        if (req.file) {
            const newBannerImage = req.file.filename;
            banner.bannerImage = [newBannerImage];
        }

        await banner.save();

        res.redirect('/admin/bannerList');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const deleteBanner = async(req,res)=>{
    console.log('jfhkd');
    try{
        const bannerId = req.params.bannerId;
        const banner = await Banner.findById(bannerId)

        await Banner.deleteOne(banner);
        res.redirect('/admin/bannerList');
    }catch(error){
        console.log(error.message)
    }
}

module.exports = {
    loadBanner,
    createBanner,
    bannerList,
    editBannerPage,
    editBanner,
    deleteBanner
}

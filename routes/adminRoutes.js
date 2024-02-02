const express = require('express')
const admin_route = express()
const auth = require('../middleware/adminAuth')
const categoryUpload = require("../multer/category-multer");
const adminController = require('../controllers/adminController')
const categoryController = require('../controllers/catogaryController')
const productController = require('../controllers/productController')
const couponController = require('../controllers/couponController')
const salesController = require('../controllers/salesController')
const bannerController = require('../controllers/bannerController')
const valid = require("../middleware/imageValidation");
const productUpload = require("../multer/product-upload");
const bannerUpload = require('../multer/banner-multer')
admin_route.set('view engine', 'ejs')
admin_route.set('views', './views/admin')


admin_route.use(express.static('public'))

//load login
admin_route.get("/",auth.isLogOut, adminController.loadLogin);
admin_route.post("/",  adminController.verifyLogin);


// admin home
admin_route.get('/home',auth.isLogin, adminController.loadDashboard)
admin_route.get("/logout", auth.isLogin, adminController.logout);

//product-categories
admin_route.get("/categories", auth.isLogin, categoryController.categories);

//add category
admin_route.get("/category", auth.isLogin, categoryController.category);
admin_route.post("/add-category", categoryUpload.single("image"), valid, categoryController.addCategory);
//delete
admin_route.get("/delete-category/:id", auth.isLogin, categoryController.delete);
//edit
admin_route.get("/edit-C/:id",auth.isLogin,categoryController.editCategoryPage);
admin_route.post("/edit-C/:id", categoryUpload.single("image"), categoryController.updateCategory); 
admin_route.post("/searchCat", auth.isLogin, categoryController.categorySearch);

//route product
admin_route.get("/all-products", auth.isLogin, productController.allProduct);
admin_route.get("/add-product", auth.isLogin, productController.showAddProduct);
admin_route.post("/add-product", productUpload.array("image", 4), auth.isLogin, productController.addProduct);
//edit-product
admin_route.get("/edit/:id", auth.isLogin, productController.editProductPage);
admin_route.post("/edit/:id", productUpload.array("image", 4), productController.editProduct);
admin_route.get("/delete-product/:id", auth.isLogin, productController.deleteProduct);
admin_route.post('/deletedproduct',auth.isLogin,productController.deleteProductImage)
//users list
admin_route.get("/userslist", auth.isLogin, adminController.userslist);
admin_route.post("/block-user", auth.isLogin, adminController.blockUser);
admin_route.post("/unblock-user", auth.isLogin, adminController.unblockUser);

//orders
admin_route.get("/order-list", auth.isLogin, adminController.ShowOrders);
admin_route.get("/order-detail/:id", auth.isLogin, adminController.orderDetail);
admin_route.post("/change-order-status",auth.isLogin,adminController.changeStatus);
  
//coupons
admin_route.get("/add-Coupon", auth.isLogin, couponController.loadCoupon);
admin_route.post("/addCoupon", auth.isLogin, couponController.addCoupon);
admin_route.get("/coupon", auth.isLogin, couponController.coupon);
admin_route.get("/deleteCoupon", auth.isLogin, couponController.deleteCoupon);
admin_route.get("/editCoupon", auth.isLogin, couponController.editCoupon);
admin_route.post("/updateCoupon", auth.isLogin, couponController.updateCoupon);


admin_route.get("/monthly-report", auth.isLogin, adminController.monthlyreport)
admin_route.get('/salesreport', auth.isLogin, salesController.salesReport)
admin_route.get('/reports/sales/download/:type', auth.isLogin, salesController.adminDownloadReports);

// banner
admin_route.get("/banner", auth.isLogin, bannerController.loadBanner);
admin_route.post("/banner", auth.isLogin, bannerUpload.single('bannerImage'), bannerController.createBanner);
admin_route.get("/bannerList", auth.isLogin, bannerController.bannerList);
admin_route.get("/edit-banner/:id", auth.isLogin, bannerController.editBannerPage);
admin_route.post("/edit-banner/:id", auth.isLogin,bannerUpload.single('bannerImage'), bannerController.editBanner);
admin_route.get("/delete-banner/:id", auth.isLogin, bannerController.deleteBanner);
module.exports = admin_route
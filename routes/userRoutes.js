const express = require("express")
const user_route = express()
const auth = require('../middleware/auth')
const userController = require('../controllers/userController')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const couponController = require('../controllers/couponController')
const config = require('../config/config')
const session = require('express-session')

const bodyparser = require('body-parser')
user_route.use(bodyparser.json())
user_route.use(bodyparser.urlencoded({ extended: true }))

user_route.use(session({ secret: config.sessionSecret }))

user_route.use(express.static('public'))

user_route.set('view engine', 'ejs')
user_route.set('views', './views/users')

user_route.get('/', userController.loadhome)

// Registration
user_route.get('/register', userController.loadRegister)
user_route.post('/register', userController.insertUser)

// verifying the OTP
user_route.get('/otp', userController.otpPage)
user_route.post('/validate', userController.validateOTP)
user_route.get('/resendotp', userController.resendOTP)

// Login // Logout
user_route.get('/login', userController.loginLoad)
user_route.post('/login', userController.verifyLogin)
user_route.get('/userhome',auth.isLogin, userController.loadLogin)
user_route.get('/logout', auth.isLogin, userController.logOut)

// shop-Load // Products
user_route.get('/shop',auth.isLogin, userController.shopLoad)
user_route.get('/product-details',auth.isLogin, productController.productDetails)
user_route.get('/filter', auth.isLogin, userController.subCatogary)
user_route.post('/priceFilter', auth.isLogin, userController.priceFilter)
user_route.get("/filtered-products", auth.isLogin, userController.filteredProducts)
user_route.post("/search", auth.isLogin, userController.searchProd)

// Cart
user_route.get("/cart", auth.isLogin, cartController.getCartPage)
user_route.post("/addCart", auth.isLogin, cartController.addToCart)
user_route.post("/change-quantity", cartController.changeQuantity)
user_route.post("/change-quantity2", cartController.changeQuantity2)
user_route.post("/removeFromCart", cartController.deleteCart)
user_route.get("/whishList", auth.isLogin, cartController.getwhishlistPage);
user_route.post("/addwhishlist", auth.isLogin, cartController.addTowhishlist)
user_route.post("/removeFromwhishlist", auth.isLogin, cartController.deletewhishlist)

// myprofile
user_route.get('/address', auth.isLogin, userController.profile)
user_route.get("/addAddress", auth.isLogin, userController.addressForm)
user_route.post("/addAddress", auth.isLogin, userController.confirmAddress)
user_route.get('/editaddress',auth.isLogin,userController.editAddress)
user_route.post('/editaddress', auth.isLogin, userController.confirmEdit)
user_route.post("/removeAddress", userController.removeAddress)
user_route.get("/profile", auth.isLogin, userController.editProfile)
user_route.get("/EditproFile", auth.isLogin, userController.editProFile)
user_route.post("/updateUserProfile", auth.isLogin, userController.updateUserProfile)
user_route.get("/orderDetail", auth.isLogin, userController.orderDetails)
user_route.get("/orderlist", auth.isLogin, userController.ShowOrders)

// forget-password
user_route.get('/forgetpassword',auth.isLogout, userController.forgetPasswordLoad)
user_route.post('/forgetverify',auth.isLogout, userController.forgetVerifyPassword)
user_route.get('/forget-password',auth.isLogout, userController.forgetPassword)
user_route.post('/forget-password', userController.resetPassword)

// Change-password
user_route.get('/changepassword', auth.isLogin, userController.changePassword)
user_route.post('/changepassword',auth.isLogin,userController.newpassword)

// wallet
user_route.get("/wallet", auth.isLogin, userController.wallet)
user_route.post("/verifyPayment", userController.verifyRazorpayPayment)

// checkout
user_route.post('/check-out', auth.isLogin, userController.checkout)
user_route.post("/confirmation", auth.isLogin, userController.confirmation)
user_route.get("/orderSucceed", userController.orderSucceed)
user_route.post("/change-order-status", userController.changeStatus)
user_route.get("/orderFailure", userController.orderFailure)
user_route.post("/validateCoupon", couponController.validateCoupon)
user_route.post("/invoice", userController.downloadInvoice)

module.exports = user_route
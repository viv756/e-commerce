const User = require("../models/userModel");
const Products = require("../models/product-model");
const Category = require("../models/category-model");
const Coupons = require("../models/coupon-model");
const Orders = require("../models/order-model");
const Banner = require('../models/banner-model')
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const config = require("../config/config");
const randomstring = require("randomstring");
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const Razorpay = require("razorpay")
const crypto = require("crypto");
const easyinvoice = require("easyinvoice");
const Readable = require('readable')

// load landing-page
const loadhome = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.render("userhome", {
      log: req.session.isLoggedIn,banners
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Load Register-Page
const loadRegister = async (req, res) => {
  try {
    if (req.query.id) {
      req.session.referel = req.query.id;
    }
    res.render("registration", { message: false });
  } catch (error) {
    console.log(error.message);
  }
};

// User Verification
const objj = {};
const otpPage = async (req, res) => {
  try {
    res.render("otp", { userId: req.query.id, message: false });
  } catch (error) {
    console.log(error.message);
  }
};
// User Insertion
const insertUser = async (req, res) => {
  try {
    const { name, email, password, repeatpassword } = req.body;

    // validate name (at least 3 charcters)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!name || name.trim().length < 1 || !name.match(nameRegex)) {
      return res.render("registration", {
        message: "Name is required and must contain only letters and spaces",
      });
    }

    //   Validate email using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.match(emailRegex)) {
      // checking user already exist
      const result = await User.findOne({
        email: email,
      });
      if (result) {
        res.render("registration", {
          message: "Email id is already used",
        });
      }
    } else {
      return res.render("registration", { message: "Invalid Email address" });
    }

    // Validate password (either all numbers or all letters, at least 8 characters)
    const passwordRegex = /^(?:\d+|[a-zA-Z]+){8,}$/;
    if (!password.match(passwordRegex)) {
      return res.render("registration", {
        message: "Password must be at least 8 characters long and consist of either all numbers or all letters",
      });
    }

    // Check password is match
    if (password !== repeatpassword) {
      return res.render("registration", { message: "Password did't match" });
    }

    // Hash the password
    const spassword = await securePassword(password);
    console.log(spassword);

    // Creating a new User
    const newUser = new User({
      name: name,
      email: email,
      password: spassword,
      repeatpassword: spassword,
      is_admin: 0,
    });
    // saving userdata in session
    req.session.newUser = newUser;
    // save the user to Database
    const userData = await newUser.save();
    // Generate OTP and send Verification Mail
    if (userData) {
      const otp = randomstring.generate({ length: 4, charset: "numeric" });
      objj.OTP = otp;
      console.log(objj.OTP);
      await sendOTPVerificationEmail(name, email, otp);
      res.redirect(`/otp?id=${userData.id}`);
    } else {
      res.render("registration", { message: "Your regisration is failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// password Hashing
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// SEND Email for otp verification
const sendOTPVerificationEmail = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailuser,
        pass: config.emailpassword,
      },
    });

    const mailOptions = {
      from: config.emailuser,
      to: email,
      subject: "For Verification Mail",
      html: `
            <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Evara</a>
              </div>
              <p style="font-size:1.1em">Hi,</p>
              <p> Hi ${name}.Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
              <p style="font-size:0.9em;">Regards,<br />Evara</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Your Brand Inc</p>
                <p>1600 Amphitheatre Parkway</p>
                <p>California</p>
              </div>
            </div>
          </div>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("Email Has Been SEnd", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const data = req.session.newUser;
    const userId = req.query.userId.trim();
    console.log(userId);
    const otp = randomstring.generate({ length: 4, charset: "numeric" });
    objj.OTP = otp;
    console.log("Resend OTP :", objj.OTP);
    await sendOTPVerificationEmail(data.name, data.email, otp);
    const userData = await User.findOne({ _id: userId });

    console.log(userData);
    res.redirect(`otp?id=${userData.id}`);
  } catch (error) {
    console.log(error.message);
  }
};

// Validating the OTP
const validateOTP = async (req, res) => {
  try {
    const { otp1, otp2, otp3, otp4 } = req.body;
    const Newotp = `${otp1}${otp2}${otp3}${otp4}`;

    if (objj.OTP === Newotp) {
      delete objj.OTP;
      const id = req.body.userId.trim();

      const updateInfo = await User.updateOne({ _id: id }, { $set: { is_verified: 1 } });
      res.render("login", { message: "Successfully Registered" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// rendering the login page

const loginLoad = async (req, res) => {
  try {
    if (req.session.user) {
      res.redirect("/");
    } else {
      res.render("login", { message: false });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Login Verification
const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validating email using Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.match(emailRegex)) {
      return res.render("login", { message: "Incorrect email Format" });
    }
    // validating password using Regex
    const passwordRegex = /^(?:\d+|[a-zA-Z]+){8,}$/;
    if (!password.match(passwordRegex)) {
      return res.render("login", { message: "Incorrect password format" });
    }
    // Finding User Verified or Not
    const userData = await User.findOne({ email: email, is_verified: 1 });
    if (userData) {
      const passwordmatch = await bcrypt.compare(password, userData.password);

      if (req.session.referel) {
        req.session.user = userData;
        console.log(req.session.referel,'req.session.referel');
        const refererId = req.session.referel;
        const userId = req.session.user;
        const walletUpdateAmount = 200;
        const historyUpdateAmount = 200;

        // Update the referer's wallet and push a new history record
        await User.findByIdAndUpdate(
          refererId,
          {
            $push: {
              wallet: {
                amount: walletUpdateAmount,
                paymentType: "C",
                timestamp: Date.now(),
              },
              history: {
                amount: historyUpdateAmount,
                paymentType: "Credit",
                timestamp: Date.now(),
              },
            },
          },
          { new: true }
        );
        await User.findByIdAndUpdate(
          req.session.user,
          {
            $push: {
              wallet: {
                amount: walletUpdateAmount,
                paymentType: "C",
                timestamp: Date.now(),
              },
              history: {
                amount: historyUpdateAmount,
                paymentType: "Credit",
                timestamp: Date.now(),
              },
            },
          },
          { new: true }
        );
      }
      if (passwordmatch) {
        req.session.user = userData._id;
        req.session.isLoggedIn = true;
        res.redirect("/userhome");
      } else {
        res.render("login", { message: "Email and Password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and Password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Load-userhome
const loadLogin = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.render("userhome", { log: req.session.isLoggedIn,banners });
  } catch (error) {
    console.log(error.message);
  }
};

const logOut = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

// Shop Load
const shopLoad = async (req, res) => {
  try {
    if (!req.session.isLoggedIn) {
      res.redirect("/login");
    } else {
      await Products.find()
        .lean()
        .then((data) => {
          const itemsperpage = 6;
          const currentpage = parseInt(req.query.page) || 1;
          const startindex = (currentpage - 1) * itemsperpage;
          const endindex = startindex + itemsperpage;
          const totalpages = Math.ceil(data.length / 6);
          const currentproduct = data.slice(startindex, endindex);
          res.render("Shop", {
            log: req.session.isLoggedIn,
            totalpages,
            currentpage,
            data: currentproduct,
          });
        });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const subCatogary = async (req, res, next) => {
  try {
   

    await Products.find({ category: req.query.cat })
      .lean()
      .then((data) => {
        data.reverse();
        const itemsperpage = 6;
        const currentpage = parseInt(req.query.page) || 1;
        const startindex = (currentpage - 1) * itemsperpage;
        const endindex = startindex + itemsperpage;
        const totalpages = Math.ceil(data.length / itemsperpage);
        const currentproduct = data.slice(startindex, endindex);

        res.render("single-product", {
          log: req.session.isLoggedIn,
          data: currentproduct,
          currentCat: req.query.cat,
          totalpages,
          currentpage,
        });
      })
      .catch((err) => {
        console.log(err.message);
      });
  } catch (error) {
    console.log(error.message);
  }
};

const priceFilter = async (req, res) => {
  try {
    const priceRangeString = req.body.priceRange;
    const [minPrice, maxPrice] = priceRangeString
      .replace(/[^\d-]/g, "") // Remove non-numeric characters except hyphen
      .split("-")
    console.log(maxPrice)
    const filteredProducts = await Products
  .find({
    $expr: {
      $and: [
        { $gte: [{ $toDouble: "$sale_price" }, parseFloat(minPrice)] },
        { $lte: [{ $toDouble: "$sale_price" }, parseFloat(maxPrice)] }
      ]
    }
  })
  .lean();
    res.json({
      data: filteredProducts
    });
  } catch (error) {
    console.log(error.message);
  }
};

const filteredProducts = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) {
      res.redirect("/login");
    } else {
      // Retrieve the encoded data from the query parameter
      const encodedData = req.query.data;
      const currentPage = parseInt(req.query.page) || 1; // Get the current page from the query parameter

      if (encodedData) {
        // Decode the query parameter and parse it back to an object
        const filteredData = JSON.parse(decodeURIComponent(encodedData));

        // Implement pagination logic here based on currentPage and itemsPerPage
        const itemsPerPage = 6; // Number of items to display per page
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const totalProducts = filteredData.length;
        const totalPages = Math.ceil(totalProducts / itemsPerPage);
        const currentProducts = filteredData.slice(startIndex, endIndex);

        // Pass the filtered data and pagination information to the view
        res.render("filtered-products", {
          currentData:encodedData,
          log: req.session.isLoggedIn,
          data: currentProducts,
          currentpage: currentPage,
          totalpages: totalPages,
        });
      } else {
        // Handle case where there is no filtered data available
        res.render("filtered-products", {
          log: req.session.isLoggedIn,
          data: null,
          currentpage: null,
          totalpages: null,
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// search product
const searchProd = async (req, res) => {
  try {
    let data = await Products.find({
      name: { $regex: `${req.body.search}`, $options: "i" },
    })
    res.render("shop", { data, log: req.session.isLoggedIn })
  } catch (error) {
    console.log(error.message)
  }
}

// myprofile
const profile = async (req, res) => {
  try {
    let userdata = await req.session.user;
    User.findById(userdata).then((data) => {
      res.render("myprofile", { data, userdata, log: req.session.isLoggedIn });
    });
  } catch (error) {
    console.log(error.message);
  }
};

//Address
const addressForm = async (req, res, next) => {
  try {
    await User.find({}).then((data) => {
      res.render("add-address", { data, log: req.session.isLoggedIn });
    });
  } catch (error) {
    console.log(error.message);
  }
};

// add-address
const confirmAddress = async (req, res, next) => {
  try {
    let id = req.session.user;

    await User.findByIdAndUpdate(
      { _id: id },
      {
        $push: {
          address: {
            _id: new mongoose.Types.ObjectId(),
            name: req.body.name,
            number: req.body.number,
            altNumber: req.body.altNumber,
            pincode: req.body.pincode,
            house: req.body.house,
            area: req.body.area,
            landmark: req.body.landmark,
            town: req.body.town,
            state: req.body.state,
          },
        },
      }
    );
    res.redirect("/address");
  } catch (error) {
    console.log(error.message);
  }
};

// edit-address
const editAddress = async (req, res) => {
  try {
    const adressId = req.query.id;
    const login = req.session.user;
    const objectId = new mongodb.ObjectId(login);
    const profile = await User.findById(login);
    const userAddress = profile.address.id(adressId);
    res.render("editaddress", { userAddress, log: req.session.isLoggedIn });
  } catch (error) {
    console.log(error.message);
  }
};

//confirm-edit
const confirmEdit = async (req, res, next) => {
  try {
    const quer = req.query.id;
    let id = req.session.user;
    const user = await User.findById(id);
    const address = user.address.id(quer);
    address.set({
      name: req.body.name,
      number: req.body.number,
      altNumber: req.body.altNumber,
      pincode: req.body.pincode,
      house: req.body.house,
      area: req.body.area,
      landmark: req.body.landmark,
      town: req.body.town,
      state: req.body.state,
    });
    await user.save();

    res.redirect("/address");
  } catch (error) {
    console.log(error.message);
  }
};

// address deletion
const removeAddress = async (req, res, next) => {
  try {
    id = req.session.user;

    const profile = await User.findById(id);
    profile.address.pull(req.body.addressId);
    await profile.save();
    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
  }
};

// editProfile
const editProfile = async (req, res, next) => {
  try {
    let userdata = await req.session.user;
    let data = await User.findById(userdata);
    res.render("Profile", {
      data,
      userdata,
      log: req.session.isLoggedIn,
    });
  } catch (error) {
    console.log(error.message);
  }
};

// editProFile
const editProFile = async (req, res, next) => {
  try {
    let userdata = await req.session.user;

    // const data = req.params.userId;
    // const profile = await user.findById(id);
    User.findById(userdata).then((data) => {
      res.render("editProFile", { data, userdata, log: req.session.isLoggedIn });
    });
  } catch (error) {
    console.log(error.message);
  }
};

// updateUserProfile
const updateUserProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    console.log(req.session, "session");
    // console.log(req.body, "req.body");
    const updateUser = await User.findOneAndUpdate({ _id: req.session.user }, { $set: { name: name, email: email } });
    // console.log(updateUser, "updateUser");
    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
  }
};

// forget-password
const forgetPasswordLoad = async (req, res) => {
  try {
    res.render("forgetpassword", { message: false });
  } catch (error) {
    console.log(error.message);
  }
};

//forget-password (verifying the email and send otp)
const forgetVerifyPassword = async (req, res) => {
  try {
    console.log("first");
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_verified === 0) {
        res.render("forgetpassword", { message: "please verify Your Account" });
      } else {
        console.log("second");
        const randomString = randomstring.generate({ length: 4, charset: "numeric" });
        console.log("third");
        const updateUser = await User.updateOne({ email: email }, { $set: { token: randomString } });
        sendResetPasswordMail(userData.name, userData.email, randomString);
        res.render("forgetpassword", { message: "Please check your mail for reset password" });
      }
    } else {
      res.render("forgetpassword", { message: "Your Email Is Incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailuser,
        pass: config.emailpassword,
      },
    });
    const mailOption = {
      from: "aswinbrototype@gmail.com",
      to: email,
      subject: "For Reset password",
      html: "<p>Hyy " + name + ', please click here to <a href="http://127.0.0.1:5000/forget-password?token=' + token + ' "> Reset </a> your password</p>',
    };
    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
      } else {
        console.log("Email has been send :-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// change password load
const forgetPassword = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("reset-password", { user_id: tokenData.id, message: false });
    } else {
      res.render("users/404", { message: "Token is invalid" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// reset-password
const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const secure_password = await securePassword(password);
    await User.findOneAndUpdate({ _id: req.body.user_id }, { $set: { password: secure_password, token: "" } });
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

// change-password Load
const changePassword = async (req, res) => {
  try {
    let message;
    if (req?.query?.message) {
      message = req?.query?.message;
    }
    console.log(message, "message");
    res.render("changepassword", { message });
  } catch (error) {
    console.log(error.message);
  }
};

// new password
const newpassword = async (req, res) => {
  try {
    const { oldpassword, newpassword, confirmpassword } = req.body;
    console.log(req.body, "req.body");
    console.log(req.session, "session");

    const userData = await User.findOne({ _id: req.session.user });
    console.log(userData);
    console.log(oldpassword);
    const checkPasswword = await bcrypt.compare(oldpassword, userData.password);
    if (checkPasswword) {
      if (newpassword === confirmpassword) {
        const spassword = await securePassword(newpassword);
        console.log(spassword);
        const updatePassword = await User.updateOne({ _id: req.session.user }, { $set: { password: spassword } });
        res.json({ success: true, message: "password updated successfully" });
      } else {
        res.redirect("/changepassword?message=Incorrect password");
      }
    } else {
      res.redirect("/changepassword?message=Incorrect password");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// wallet
const wallet = (req, res, next) => {
  try {
    const userId = req.session.user;
    User.findById(userId).then((data) => {
      data.wallet.reverse();

      const itemsperpage = 5;
      const currentpage = parseInt(req.query.page) || 1;
      const startindex = (currentpage - 1) * itemsperpage;
      const endindex = startindex + itemsperpage;
      const totalpages = Math.ceil(data.wallet.length / 5);
      const currentproduct = data.wallet.slice(startindex, endindex);
      console.log("Current products : ", currentproduct);

      res.render("wallet", {
        log: req.session.isLoggedIn,
        data: currentproduct,
        totalpages,
        currentpage,
      });
    });
  } catch (err) {
    res.render('404')
  }
};

//show-orders
const ShowOrders = async (req, res, next) => {
  try {
    const oid = new mongodb.ObjectId(req.query.id);
    const orders = await Orders.aggregate([
      { $match: { user: oid } },
      { $unwind: "$items" },
      {
        $project: {
          proId: { $toObjectId: "$items.product" },
          quantity: "$items.quantity",
          address: "$address",
          items: "$items",
          finalAmount: "$finalAmount",
          createdAt: "$createdAt",
          orderStatus: "$orderStatus",
          paymentMode: "$paymentMode",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "proId",
          foreignField: "_id",
          as: "ProductDetails",
        },
      },
    ]);
    orders.reverse();
    const itemsperpage = 5;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(orders.length / 5);
    const currentproduct = orders.slice(startindex, endindex);
    let userData = req.session.user;
    res.render("orderlist", {
      orders: currentproduct,
      totalpages,
      currentpage,
      userData,
      log: req.session.isLoggedIn,
    });
  } catch (error) {
 console.log(error.message)
  }
};


//order-details
const orderDetails = async (req, res, next) => {
  try {
    const oid = new mongodb.ObjectId(req.query.id);

    const user = req.session.user;
    const orders = await Orders.aggregate([
      { $match: { _id: oid } },
      { $unwind: "$items" },
      {
        $project: {
          proId: { $toObjectId: "$items.product" },
          quantity: "$items.quantity",
          address: "$address",
          items: "$items",
          finalAmount: "$finalAmount",
          createdAt: "$createdAt",
          discount: "$discount",
          orderStatus: "$orderStatus",
          paymentMode: "$paymentMode",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "proId",
          foreignField: "_id",
          as: "ProductDetails",
        },
      },
    ]);
    let userData = req.session.user;

    res.render("orderDetails", {
      order: orders,
      userData,
      log: req.session.isLoggedIn,
    });
  } catch (error) {
   console.log(error.message)
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const orderId = req.body.orderId;
    const newStatus = req.body.status;

    // Find the order by ID
    const order = await Orders.findById(orderId);

    if (!order) {
      return res.json(false); // Order not found, return false
    }

    // Check if the order status is being changed to 'cancelled'
    if (
      order.orderStatus !== " Order cancelled" &&
      newStatus === " Order cancelled"
    ) {
      // If the order is being cancelled, restore product quantities
      for (const item of order.items) {
        const product = await Products.findById(item.product);
        if (product) {
          // Increment the product quantity by the quantity in the canceled order item
          product.quantity += item.quantity;
          await product.save();
        }
      }
    }

    // Update the order status in the database
    const updatedOrder = await Orders.findByIdAndUpdate(orderId, {
      orderStatus: newStatus,
    });

    // Perform other logic here (addToWallet or any other operations)
    addToWallet(req, res, order.totalAmount, "c");

    console.log(updatedOrder);
    res.json(true);
  } catch (err) {
    console.log(err);
    res.json(false);
  }
};

//add to wallet
const addToWallet = async (req, res, amount, transactionType) => {
  try {
    let id = req.session.user;

  await User
    .findByIdAndUpdate(id, {
      $push: {
        wallet: { amount: Number(amount), paymentType: transactionType },
      },
    })
    .then((data) => {
      console.log(data?.wallet);
    });
  } catch (error) {
    res.render('404')
  }
};

// load checkout
const checkout = async (req, res) => {
  try {
    const coupon = await Coupons.find({
      minimumAmount:{$lte:req.body.total}
    })
    console.log(coupon,"cou")
   const userData = await User.find({ _id: req.session.user })
    if (userData) {
      res.render("check-out", {data:userData,total:req.body.total,coupon,log:req.session.isLoggedIn})
    }
    console.log(userData,"user")
  } catch (error) {
    console.log(error.message)
  }
}

// confirmation of order
const confirmation = async (req, res, next) => {
  try {
    console.log("confi")
    const discount = req.body.discount;
    const status = req.body.payment;
    const userData = await User.findById(req.session.user);
    const items = [];

    let canPlaceOrder = true; // Initialize a flag to check if the order can be placed

    for (let i = 0; i < userData.cart.length; i++) {
      const product = await Products.findById(userData.cart[i].productId);

      if (product) {
        if (product.quantity < 1) {
          canPlaceOrder = false; // Product quantity is below 1, cannot place the order
          console.error(`Product with ID ${product._id} has quantity below 1.`);
          return res.json({stockerr:true})
        } else {
          const temp = {
            product: product._id,
            quantity: userData.cart[i].quantity,
            price: product.sale_price,
            discount,
          };
          items.push(temp);

          const updatedDetails = await Products.findByIdAndUpdate(
            temp.product,
            { $inc: { quantity: -parseInt(temp.quantity, 10) } },
            { new: true }
          );
        }
      } else {
        // Handle the case where the product doesn't exist
        console.error(
          `Product with ID ${userData.cart[i].productId} not found.`
        );
      }
    }

    if (!canPlaceOrder) {
      // Redirect back when a product quantity is below 1
      res.redirect("/check-out"); // Replace with your desired redirection path
      return; // Exit the function early
    }

    // let total = req.body.GrandTotal
    // console.log(total,'totaltotal');
    console.log(req.body, "BODY>>>>>>>>>>>>>>>>>>>>.");
    const order = await Orders.create({
      user: req.session.user,
      items,
      orderStatus: "pending",
      totalAmount: "0",
      finalAmount: req.body.GrandTotal,
      paymentMode: status,
      address: userData.address[0],
      discount,
      //discount: req.body.GrandTotal,
    });
    console.log(order, "orderCreated");

    if (order.paymentMode === "cod") {
      id = req.session.user;
      await User
        .findByIdAndUpdate(id, { $set: { cart: [] } })
        .then((data) => {})
        .catch((err) => {});

      res.json({ payment: true, method: "cod", order: order });
    } else if (order.paymentMode === "online") {
      const generatedOrder = await generateOrderRazorpay(
        order._id,
        req.body.GrandTotal
      );
      res.json({
        payment: true,
        method: "online",
        razorpayOrder: generatedOrder,
        order: order,
        //total: req.body.GrandTotal,
      });
    } else if (order.paymentMode === "wallet") {
      id = req.session.user;
      await User
        .findByIdAndUpdate(id, { $set: { cart: [] } })
        .then((data) => {})
        .catch((err) => {});

      await User
        .findByIdAndUpdate(id, {
          $push: {
            wallet: {
              amount: Number(-order.totalAmount),
              timestamp: Date.now(),
              paymentType: "D",
            },
          },
        })
        .then((data) => {
          console.log(data?.wallet);
        });

      res.json({ payment: true, method: "cod", order: order });
    }
  } catch (error) {

 console.log(error.message)
    
  }
};

const orderSucceed = async (req, res, next) => {
  try {
    res.render("ordersucceed", { log: req.session.isLoggedIn });
  } catch (err) {
   console.log(err)
  }
};

const orderFailure = async (req, res, next) => {
  try {
    res.render("orderFailure", { log: req.session.isLoggedIn });
  } catch (err) {
   console.log(err)
  }
};

const instance = new Razorpay({
  key_id: "rzp_test_WAA12dkisNH02g",
  key_secret: "XMl7HRFy5aze5n13mspUnN51",
});


//generate razor-pay order
const generateOrderRazorpay = (orderId, total) => {
  return new Promise((resolve, reject) => {
    const options = {
      amount: total * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: String(orderId),
    };
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log("Order Generated RazorPAY: " + JSON.stringify(order));
        resolve(order);
      }
    });
  });
};

//verify razor-pay payment
const verifyRazorpayPayment = (req, res, next) => {
  try {
    verifyOrderPayment(req.body)
      .then(async () => {
        id = req.session.user;
        await User
          .findByIdAndUpdate(id, { $set: { cart: [] } })
          .then((data) => {})
          .catch((err) => {});

        res.json({ status: true });
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: false, errMsg: "Payment failed!" });
      });
  } catch (err) {
    next(err);
    res.json({ status: false, errMsg: "Payment failed!" });
  }
};

//verify order
const verifyOrderPayment = (details) => {
  console.log("DETAILS : " + JSON.stringify(details));
  return new Promise((resolve, reject) => {
   
    let hmac = crypto.createHmac("sha256", "XMl7HRFy5aze5n13mspUnN51");
    hmac.update(
      details.payment.razorpay_order_id +
        "|" +
        details.payment.razorpay_payment_id
    );
    hmac = hmac.digest("hex");
    if (hmac == details.payment.razorpay_signature) {
      resolve();
    } else {
      reject();
    }
  });
};

// invoice
const downloadInvoice = async (req, res, next) => {
  try {
    const id = req.query.id;
    const userId = req.session.user._id;
    const result = await Orders.findById(id);
    console.log(result, "result");
    //const product = await productModel.findById(result.items[0].product);
    //const product = result.items.map(item => item.product);

    const user = await User.findOne({ _id: userId });

    const order = {
      _id: id,
      totalAmount: result.finalAmount,
      date: result.createdAt, // Use the formatted date
      paymentMethod: result.paymentMode,
      orderStatus: result.orderStatus,
      discount: result.discount,
      name: result.address[0].name,
      number: result.address[0].number,
      pincode: result.address[0].pinCode,
      area: result.address[0].area,
      landmark: result.address[0].landmark,
      state: result.address[0].state,
      house: result.address[0].house,
      items: result.items,
    };

    console.log(order, "orderorderorder");

    //set up the product
    const products = await Promise.all(
      order.items.map(async (item) => {
        const product = await Products.findById(item.product);
        return {
          quantity: parseInt(item.quantity),
          description: product.name,
          price: parseInt(product.sale_price),
          total: parseInt(item.price), // Assuming item.price is the total price for the current item
          "tax-rate": 0,
        };
      })
    );
    console.log(products, "productsproducts");
    const isoDateString = order.date;
    const isoDate = new Date(isoDateString);

    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = isoDate.toLocaleDateString("en-US", options);
    const data = {
      customize: {
        //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html
      },
      images: {
        // The invoice background
        background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
      },
      // Your own data
      sender: {
        company: "Evara clothings",
        address: "Evara clothings Hub maradu",
        city: "Kochi",
        country: "India",
      },
      client: {
        company: "Customer Address",
        zip: order.pincode,
        city: order.area,
        address: order.name,
      },
      information: {
        // Invoice number
        number: "order:" + order._id,
        // ordered date
        date: formattedDate,
      },
      products: products,
      "bottom-notice": "Happy shoping and visit here again",
    };

    const pdfResult = await easyinvoice.createInvoice(data);
    const pdfBuffer = Buffer.from(pdfResult.pdf, "base64");

    // Set HTTP headers for the PDF response
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.setHeader("Content-Type", "application/pdf");

    // Create a readable stream from the PDF buffer and pipe it to the response
    const pdfStream = new Readable();
    pdfStream.push(pdfBuffer);
    pdfStream.push(null);

    pdfStream.pipe(res);
  } catch (err) {
    res.render('404')
    //   res.status(500).json({ error: error.message });
  }
};

  module.exports = {
    loadhome,
    loadRegister,
    insertUser,
    otpPage,
    validateOTP,
    resendOTP,
    loginLoad,
    verifyLogin,
    logOut,
    loadLogin,
    shopLoad,
    profile,
    addressForm,
    confirmAddress,
    editAddress,
    confirmEdit,
    removeAddress,
    editProfile,
    editProFile,
    updateUserProfile,
    forgetPasswordLoad,
    forgetVerifyPassword,
    forgetPassword,
    resetPassword,
    changePassword,
    newpassword,
    subCatogary,
    priceFilter,
    filteredProducts,
    searchProd,
    checkout,
    wallet,
    confirmation,
    orderSucceed,
    orderDetails,
    ShowOrders,
    changeStatus,
    orderFailure,
    verifyRazorpayPayment,
    downloadInvoice
  }

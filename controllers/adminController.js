const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Orders = require('../models/order-model')
const Products = require('../models/product-model')
const moment = require('moment')
//login page
const loadLogin = async (req, res, next) => {
  try {
   return res.render("adminLogin", { message: false });
  } catch (error) {
    console.log(error.message);
  }
};

// login verification
const verifyLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email, is_admin: 1 });

    if (userData) {
      // Validate password (either all numbers or all letters, at least 8 characters)
      const passwordRegex = /^(?:\d+|[a-zA-Z]+){8,}$/;
      if (!password.match(passwordRegex)) {
        return res.render("adminLogin", { message: "Invalid password format" });
      }

      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin == 0) {
         return res.render("adminLogin", {
            message: "Email and password are incorrect",
          });
        } else {
          req.session.user_id = userData._id;
          return res.redirect("/admin/home");
        }
      } else {
        return res.render("adminLogin", {
          message: "Email and password are incorrect",
        });
      }
    } else {
      return res.render("adminLogin", { message: "Email and password are incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//   Load Dashboard
const loadDashboard = async (req, res, next) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    // const users = await User.find({ is_admin: 0 });
    const currentPage = "/admin/home";
    res.render("adminhome", { currentPage, userData }); // Updated argument names
  } catch (error) {
    console.log(error.message);
  }
};

// logout
const logout = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    res.render("404");
  }
};

// user-list
const userslist = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = 5; // Number of users per page
    const skip = (page - 1) * limit;

    const users = await User.find({ is_admin: 0 }).skip(skip).limit(limit);
    const totalUsers = await User.countDocuments({ is_admin: 0 });
    const currentPage = "/admin/userslist";

    res.render("page-sellers-list", {
      users,
      currentPage: page,
      currentPage,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (err) {
    res.render("404");
  }
};

//block-user
const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.body; // Extract userId from request body

    // Assuming `user` is your Mongoose model, make sure to pass `userId` as an ObjectId
    // Update the user's verification status in the database
    await User.findByIdAndUpdate(userId, { is_verified: 0 });

    res.status(200).send("User blocked successfully"); // Send a success response back to the client
  } catch (err) {
    console.error("Error blocking user:", err);
    res.status(500).send("Internal Server Error"); // Send an error response back to the client
  }
};

// unblock-user
const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.body; // Extract userId from request body

    // Assuming `user` is your Mongoose model, make sure to pass `id` as an ObjectId
    // Update the user's verification status in the database
    await User.findByIdAndUpdate(userId, { is_verified: 1 });

    res.status(200).send("User unblocked successfully"); // Send a success response back to the client
  } catch (err) {
    console.error("Error unblocking user:", err);
    res.render("404"); // Send an error response back to the client
  }
};

// orders listing in admin side
const ShowOrders = async (req, res, next) => {
  try {
    let doc = await Orders.aggregate([
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]);
    const itemsperpage = 7;
    const count = doc[0].total;

    const page = req.query.page || 1;

    let orders = await Orders.aggregate([
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
      { $sort: { createdAt: -1 } },
      { $skip: itemsperpage * (page - 1) },
      { $limit: itemsperpage },
    ]);
    const currentPage = "/admin/order-list";
    const totalPages = Math.ceil(itemsperpage);
    res.render("orders-list", { orders, totalPages, page, currentPage });
  } catch (error) {
    console.log(error.message)
  }
}

const orderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Orders
      .findById(orderId)
      .lean()
      .populate("items.product", "name price"); // Assuming 'items.product' is the reference to the 'Product' model
    const productName = order.items[0].product.name;

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("page-orders-detail", {
      data: order,
    });
  } catch (error) {
 console.log(error.message)
  }
};

const changeStatus = (req, res, next) => {
  try {
    Orders
      .findByIdAndUpdate(req.body.orderId, { orderStatus: req.body.status })
      .then((status) => {
        res.json(true);
      })
      .catch((err) => {
        console.log(err);
        res.json(false);
      });
  } catch (err) {
    next(err);
    res.json(false);
  }
};

const monthlyreport = async (req, res) => {
  try {
    console.log("enteredd");
    const start = moment().subtract(30, "days").startOf("day"); // Data for the last 30 days
    const end = moment().endOf("day");

    const orderSuccessDetails = await Orders.find({
      createdAt: { $gte: start, $lte: end },
      orderStatus: "Delivered",
    });
    console.log(orderSuccessDetails, "orderSuccessDetails");

    const monthlySales = {};

    orderSuccessDetails.forEach((order) => {
      const monthName = moment(order.order_date).format("MMMM");
      if (!monthlySales[monthName]) {
        monthlySales[monthName] = {
          revenue: 0,
          productCount: 0,
          orderCount: 0,
          codCount: 0,
          razorpayCount: 0,
        };
      }

      monthlySales[monthName].revenue += order.finalAmount;
      monthlySales[monthName].productCount += order.items.length;
      monthlySales[monthName].orderCount++;

      if (order.payment === "cod") {
        monthlySales[monthName].codCount++;
      } else if (order.payment === "Razorpay") {
        monthlySales[monthName].razorpayCount++;
      }
    });

    const monthlyData = {
      labels: [],
      revenueData: [],
      productCountData: [],
      orderCountData: [],
      codCountData: [],
      razorpayCountData: [],
    };

    for (const monthName in monthlySales) {
      if (monthlySales.hasOwnProperty(monthName)) {
        monthlyData.labels.push(monthName);
        monthlyData.revenueData.push(monthlySales[monthName].revenue);
        monthlyData.productCountData.push(monthlySales[monthName].productCount);
        monthlyData.orderCountData.push(monthlySales[monthName].orderCount);
        monthlyData.codCountData.push(monthlySales[monthName].codCount);
        monthlyData.razorpayCountData.push(
          monthlySales[monthName].razorpayCount
        );
      }
    }
    console.log(monthlyData, "monthlyData");
    return res.json(monthlyData);
  } catch (error) {
    console.error(error);
    return res.render('404',{message: "An error occurred while generating the monthly report."})
  }
};
  
module.exports = {
  loadDashboard,
  loadLogin,
  verifyLogin,
  logout,
  userslist,
  blockUser,
  unblockUser,
  ShowOrders,
  orderDetail,
  changeStatus,
  monthlyreport
}

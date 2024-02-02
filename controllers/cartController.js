const User = require("../models/userModel");
const Products = require("../models/product-model");
const mongodb = require("mongodb");
const mongoose = require("mongoose");

module.exports = {
  // to render Cart Page
  getCartPage: async (req, res) => {
    try {
      const userId = req.session.user;
      let user = userId;
    

      const oid = new mongodb.ObjectId(userId); // Use mongoose.Types.ObjectId
      

      let cartProducts = await User.aggregate([
        { $match: { _id: oid } },
        { $unwind: "$cart" },
        {
          $project: {
            proId: { $toObjectId: "$cart.productId" }, // Convert productId to ObjectId
            quantity: "$cart.quantity",
            size: "$cart.size",
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

      if (cartProducts.length > 0) {
        let totalPrice = 0;
        let quantity = 0;

        for (let i = 0; i < cartProducts.length; i++) {
          quantity = cartProducts[i].quantity;
          totalPrice = totalPrice + quantity * cartProducts[i]?.ProductDetails[0]?.sale_price;
        }

        res.render("cart", {
          user,
          cart: cartProducts,
          total: totalPrice,
          log: req.session.isLoggedIn,
        });
      } else {
        res.render("cart", { user, cart: cartProducts, log: req.session.isLoggedIn });
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  //add product to cart
  addToCart: async (req, res, next) => {
    try {
      let id = req.session.user;
      let productId = req.query.id.trim();
      let quantity = parseInt(req.body.quantity);
      let newPrice = parseInt(req.body.new_price);
      let size = req.body.size;

      console.log(size, "size");
      console.log(newPrice, "price");
      const userData = await User.findById({ _id: id });

      if (!userData) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      // Check if the product is already in the cart
      const cartIndex = userData.cart.findIndex((item) => item.productId === productId);

      if (cartIndex !== -1) {
        return res.status(200).json({ success: false, message: "Product already in cart." });
      }
      let productquantity;
      let product = await Products.findOne({ _id: productId });
      if (product) {
        productquantity = product.quantity;
      }

      // Product is not in the cart, add it
      await User.findByIdAndUpdate(id, {
        $push: {
          cart: {
            productId: productId,
            quantity: quantity,
            newPrice: newPrice,
            size: size,
            productquantity,
          },
        },
      });

      res.status(200).json({ success: true, message: "Product added to cart." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to add product to cart." });
    }
  },

//   change quantity
  changeQuantity: async (req, res) => {
    try {
      req.body.count = Number(req.body.count);
      req.body.quantity = Number(req.body.quantity);

      let product = await Products.findById(req.body.proId);
      if (req.body.quantity >= product.quantity && req.body.count == 1) {
        res.json({ status: "Out Of Stock" });
      } else if (req.body.count == -1 && req.body.quantity == 1) {
      await User.updateOne({ _id: req.body.userId }, { $pull: { cart: { proId: req.body.proId } } }).then((status) => {
          res.json({ status: true });
      });
      } else {
       await User.updateOne({ _id: new mongoose.Types.ObjectId(req.body.userId), "cart.productId": req.body.proId },
              { $inc: { "cart.$.quantity": req.body.count } },
              { new: true })
              .then((data) => {
                  res.json({status:true})
              })
       
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  
  changeQuantity2: async (req, res, next) => {
    try {

    const finalAmount = req.body.finalAmount;
    console.log(req.body,'finalAmountfinalAmount');

    // Fetch the user document
    const userDoc = await User.findOne({ _id: req.session.user });

    // Update each element in the cart array with the finalAmount
    const updatedCart = userDoc.cart.map((cartItem) => {
      return { ...cartItem, finalAmount };
    });
    console.log(updatedCart,'updatedCartupdatedCart');

    // Update the user document with the modified cart
    await User.updateOne(
      { _id: req.session.user },
      { $set: { cart: updatedCart } }
    );

    } catch (err) {
      res.render('404')
    }
  },

  //to delete from cart
  deleteCart: async (req, res) => {
    try {
      await User.updateOne(
        { _id: req.body.userId },
        { $pull: { cart: { productId: req.body.proId } } }
      )
        .then((data) => {
          res.json(true);
        })
        .catch((err) => {
          res.json(false);
        });
    } catch (err) {
      res.render('404')
    }
  },

  //to add to whishlist
  addTowhishlist: async (req, res, next) => {
    try {
        let id = req.session.user;
        let productId = req.query.id;
        const userData = await User.findById({ _id: id }).lean();

        // Check if the product is already in the wishlist
        const isProductInWishlist = userData.whishlist.some(
            (item) => item.productId === productId
        );

        if (isProductInWishlist) {
            // Product is already in the wishlist
            res.json({ success: false, message: "Product is already in the wishlist." });
        } else {
            // Product is not in the wishlist, add it
            let quantity = parseInt(req.body.quantity);
            await User.findByIdAndUpdate(id, {
                $push: {
                    whishlist: {
                        productId: productId,
                        quantity: quantity,
                        size: req.body.size,
                    },
                },
            });
            res.json({ success: true, message: "Product added to wishlist." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to add product to wishlist." });
    }
  },
  
  
  // /to render whishlist page
  getwhishlistPage: async (req, res, next) => {
    try {
      const userId = req.session.user;

      let user = userId;
      const oid = new mongodb.ObjectId(userId);

      whishlistProducts = await User.aggregate([
        { $match: { _id: oid } },
        { $unwind: "$whishlist" },
        {
          $project: {
            proId: { $toObjectId: "$whishlist.productId" },
            quantity: "$whishlist.quantity",
            size: "$whishlist.size",
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

      console.log(JSON.stringify(whishlistProducts));
      if (whishlistProducts.length > 0) {
        let totalPrice = 0;
        let quantity = 0;

        for (let i = 0; i < whishlistProducts.length; i++) {
          quantity = whishlistProducts[i].quantity;
          totalPrice =
            totalPrice +
            quantity * whishlistProducts[i]?.ProductDetails[0]?.sale_price;
        }

        console.log(
          "whishlistProducts",
          whishlistProducts[0]?.ProductDetails[0]
        );
        res.render("whishList", {
          user,
          whishlist: whishlistProducts,
          total: totalPrice,
          log: req.session.isLoggedIn,
        });
      } else {
        res.render("whishList", { user, log: req.session.isLoggedIn });
      }

    } catch (err) {
      res.render('404')
    }
  },

   //to delete product from whishlist
   deletewhishlist: async (req, res) => {
    try {
      await User.updateOne(
        { _id: req.body.userId },
        { $pull: { whishlist: { productId: req.body.proId } } }
      )
        .then((data) => {
          res.json(true);
        })
        .catch((err) => {
          res.json(false);
        });
    } catch (err) {
      res.render('404')
    }
  },

};

const isLogin = async (req, res,next) => {
    try {
        if (req.session.user) {
            // user is loged in
            next()
        } else {
            // User is not loged in
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message)
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user) {
            res.redirect("/");
        } else {
            // User is already logged out
            next();
        }
    } catch (error) {
        console.log(error.message);
        // You might want to add more specific error handling here if needed
    }
};

module.exports = {
    isLogin,
    isLogout,
};

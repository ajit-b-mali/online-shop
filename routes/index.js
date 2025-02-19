const express = require("express");

const router = express.Router();

router.get("/", (req, res, next) => {
    res.render("pages/index", { pageTitle: "Online Shop", path: "/" });
})

router.get("/cart", (req, res, next) => {
    res.render("pages/cart", {pageTitle: "Cart", path: "cart"})
});

module.exports = router;

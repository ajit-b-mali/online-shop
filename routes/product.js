const express = require("express");
const router = express.Router();

router.get("/products", (req, res, next) => {
    res.render("pages/products", {pageTitle: "Products", path: "products"})
});

router.get("/add-product", (req, res, next) => {
    res.render("pages/add-product", {pageTitle: "Add Product", path: "add-product"})
});

router.post("/add-product", (req, res, next) => {
    res.redirect("/products");
});

module.exports = router;
const express = require("express");
const path = require("path");
const app = express();

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(require("./routes/index"));
app.use(require("./routes/product"));
app.use(require("./routes/admin"));

app.use((req, res) => {
    res.render("pages/404", {pageTitle: "Page not found", path: "" })
});

const port = 3000;
app.listen(port, "localhost", () => {
    // console.log(`Server running at port https://localhost:${port}`);
});
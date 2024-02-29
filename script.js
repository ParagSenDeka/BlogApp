
import express from "express";
import pg from "pg";
const app = express();
const db=pg.Client({

});
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.render("index.ejs", { data: data });
});

app.get("/edit/:index", (req, res) => {
    let index = req.params.index;
    res.render("modify.ejs", { index: index });
});

app.get("/new", (req, res) => {
    // To add new post 
});

app.post("/submit/:id", (req, res) => {
    // Submit the post here 
    const index=req.params.id;
    data[index].title=req.body.title;
    data[index].description=req.body.description;
    res.redirect("/");
});

app.listen(port, () => {
    console.log("Running at port " + port);
});
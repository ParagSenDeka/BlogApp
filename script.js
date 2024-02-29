
import express from "express";
import pg from "pg";
const app = express();
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "world",
    password: "781121",
    port: 5432,
});

let data = [];

db.connect();
db.query("SELECT * FROM blogData", (err, res) => {
    if (err) {
        console.error("Error executing query", err.stack);
    } else {
        data = res.rows;
    }
    db.end();
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
    const index = req.params.id;
    data[index].title = req.body.title;
    data[index].description = req.body.description;
    res.redirect("/");
});

app.listen(port, () => {
    console.log("Running at port " + port);
});
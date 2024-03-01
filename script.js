
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

db.connect();
const port = 3000;
let maxLength = 2;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    db.query("SELECT * FROM blogData ORDER BY id", (err, result) => {
        if (err) {
            console.error("Error executing query", err.stack);
            res.status(500).send("Internal Server Error");
            return;
        }
        const data = result.rows;
        console.log(data);
        res.render("index.ejs", { data: data });
    });
});


app.get("/new", (req, res) => {
    res.render("modify.ejs", { maxLength: maxLength });
});

app.get("/edit/:index", (req, res) => {
    let index = req.params.index;
    res.render("modify.ejs", { index: index });
});

app.post("/submit/:id", (req, res) => {
    // Submit the post here 
    let newData = { title: req.body.title, description: req.body.description};
    let idToUpdate = req.params.id;
    let updateQuery = {
        text: 'UPDATE blogData SET title = $1, description = $2,crDate=CURRENT_DATE WHERE id = $3',
        values: [newData.title, newData.description, idToUpdate],
    };
    db.query(updateQuery, (err, res) => {
        if (err) {
            console.error("Error executing query", err.stack);
        } else {
            console.log("Row updated successfully");
        }
    });
    res.redirect("/");
});

// app.post("/submitNew/:id",(req,res)=>{
//     maxLength++;~
//     const array=[req.body.title,req.body.description,req.body.author,maxLength]

//     db.connect();

//     db.query(`INSERT INTO blogData`)
// })

app.listen(port, () => {
    console.log("Running at port " + port);
});
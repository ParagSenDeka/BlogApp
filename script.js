
import express from "express";
import pg from "pg";
const app = express();
const db = new pg.Client({
    user: "postgresExample",
    host: "localhost",
    database: "example",
    password: "example",
    port: 5000,
});

db.connect();
const port = 3000;
let maxLength = 0;

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
        maxLength = data.length;
        res.render("index.ejs", { data: data });
    });
});

app.get("/delete/:id", (req, res) => {
    let idToDelete = req.params.id; // Replace 123 with the actual ID you want to delete
    let deleteQuery = {
        text: 'DELETE FROM blogData WHERE id = $1',
        values: [idToDelete],
    };

    db.query(deleteQuery, (err, res) => {
        if (err) {
            console.log(err.stack);
        }
        else {
            console.log("Row deleted successfully");
        }
    });
    res.redirect("/");
});


app.get("/new", (req, res) => {
    res.render("modify.ejs", { maxLength: maxLength });
});

app.get("/edit/:index", (req, res) => {
    let index = parseInt(req.params.index);
    let updateQuery = {
        text: 'SELECT title, description FROM blogData WHERE id=$1',
        values: [index]
    };
    db.query(updateQuery, (err, result) => {
        if (err) {
            console.error("Error executing query", err.stack);
            res.status(500).send("Internal Server Error");
            return;
        }
        let tempData = result.rows;
        tempData.push(index);
        console.log(tempData);
        res.render("modify.ejs", {data: tempData});
    });
});


app.post("/submit/:id", (req, res) => {
    // Submit the post here 
    let newData = { title: req.body.title, description: req.body.description };
    let idToUpdate = req.params.id;
    let updateQuery = {
        text: 'UPDATE blogData SET title = $1, description = $2,crDate=CURRENT_DATE WHERE id = $3',
        values: [newData.title, newData.description, idToUpdate],
    };
    db.query(updateQuery, (err) => {
        if (err) {
            console.error("Error executing query", err.stack);
        } else {
            console.log("Row updated successfully");
        }
    });
    res.redirect("/");
});

app.post("/submitNew/:id", (req, res) => {
    let newData = { title: req.body.title, description: req.body.description, author: req.body.author };
    let idToUpdate = maxLength + 1;
    let addQuery = {
        text: 'INSERT INTO blogData VALUES($1,$2,$3,CURRENT_DATE,$4)',
        values: [newData.title, newData.description, newData.author, idToUpdate],
    };
    db.query(addQuery, (err) => {
        if (err) {
            console.error("Error executing query", err.stack);
        } else {
            console.log("Row added successfully");
        }
    });
    res.redirect("/");
})

app.listen(port, () => {
    console.log("Running at port " + port);
});
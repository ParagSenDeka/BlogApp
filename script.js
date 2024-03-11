import express from "express";
import pg from "pg";
const app = express();
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

import dotenv from 'dotenv';
dotenv.config();

const db = new pg.Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    connectionString: process.env.POSTGRES_URL
});

db.connect()
    .then(() => {
        console.log('Connected to database');
    })
    .catch((err) => {
        console.error('Error connecting to database:', err);
    });

const port = 3000;
let maxLength = 0;
let crUser="guest";

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});
app.get('/favicon.png', (req, res) => {
    res.status(204).end();
});

app.get("/",(req,res)=>{
    res.render("login.ejs");
});

app.post('/check', async(req, res) => {
    const currentUser = {
        username:req.body.username,
        password:req.body.password
    };
    const users=await db.query("SELECT username,password FROM users ORDER BY id");
    users.rows.forEach(user=>{
        if(currentUser.username==user.username && currentUser.password==user.password){
            crUser="admin";
        }
        else{
            crUser="guest";
        }
    });
        res.redirect('/show');
});

app.get("/show", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM blogData ORDER BY id");
        const data = result.rows;
        maxLength = data.length;
        res.render("index.ejs", { data: data,user:crUser});
    } catch (err) {
        console.error("Error executing query", err.stack);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/delete/:id", async (req, res) => {
    try {
        const idToDelete = req.params.id;
        await db.query("DELETE FROM blogData WHERE id = $1", [idToDelete]);
        console.log("Row deleted successfully");
    } catch (err) {
        console.error(err.stack);
    }
    res.redirect("/show");
});

app.get("/new", (req, res) => {
    res.render("modify.ejs", { maxLength: maxLength });
});

app.get("/edit/:index", async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const result = await db.query('SELECT title, description FROM blogData WHERE id=$1', [index]);
        const tempData = result.rows;
        tempData.push(index);
        res.render("modify.ejs", { data: tempData });
    } catch (err) {
        console.error("Error executing query", err.stack);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/submit/:id", async (req, res) => {
    try {
        const newData = { title: req.body.title, description: req.body.description };
        const idToUpdate = req.params.id;
        await db.query('UPDATE blogData SET title = $1, description = $2,crDate=CURRENT_DATE WHERE id = $3', [newData.title, newData.description, idToUpdate]);
        console.log("Row updated successfully");
    } catch (err) {
        console.error("Error executing query", err.stack);
    }
    res.redirect("/show");
});

app.post("/submitNew/:id", async (req, res) => {
    try {
        const newData = { title: req.body.title, description: req.body.description, author: req.body.author };
        const idToUpdate = maxLength + 1;
        await db.query('INSERT INTO blogData VALUES($1,$2,$3,CURRENT_DATE,$4)', [newData.title, newData.description, newData.author, idToUpdate]);
        console.log("Row added successfully");
    } catch (err) {
        console.error("Error executing query", err.stack);
    }
    res.redirect("/show");
});

app.listen(port, () => {
    console.log("Running at port " + port);
});

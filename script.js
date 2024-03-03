import express from "express";
import pg from "pg";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Create a database pool
const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM blogData ORDER BY id");
        res.render("index.ejs", { data: rows });
    } catch (err) {
        console.error("Error executing query", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/delete/:id", async (req, res) => {
    try {
        const idToDelete = req.params.id;
        await pool.query("DELETE FROM blogData WHERE id = $1", [idToDelete]);
        console.log("Row deleted successfully");
        res.redirect("/");
    } catch (err) {
        console.error("Error deleting row", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/new", (req, res) => {
    res.render("modify.ejs", { maxLength: maxLength });
});

// Other routes...

// Start server
app.listen(port, () => {
    console.log("Server is running on port " + port);
});

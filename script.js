import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import { fileURLToPath } from 'url';
import path,{ dirname } from 'path';
import redist from "redis";
import connectRedis from "connect-redis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3000;
const saltRounds = 10;
let maxLength=0;
env.config();

const RedisStore = connectRedis(session);
const redisClient = new redist.createClient();
app.set("views",path.join(__dirname,"views"));

app.set("view engine","ejs");
app.use(
  session({
    store:new RedisStore({client:redisClient}),
    secret: "TOPSECRETWORD",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());


const db = new pg.Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  connectionString: process.env.POSTGRES_URL,
});
db.connect();

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/show", async (req, res) => {
  console.log(req.user);
  try {
    if (req.isAuthenticated()) {
      const result = await db.query("SELECT * FROM blogData ORDER BY id");
      const data = result.rows;
      maxLength = data.length;
      const user = true;
      res.render("secrets.ejs", { data: data, user: user });
    }
    else {
      res.redirect("/");
    }
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).send("Internal Server Error");
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/show",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      req.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/show");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            //Error with password check
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              //Passed password check
              return cb(null, user);
            } else {
              //Did not pass password check
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

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

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

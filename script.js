import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import GoogleStrategy from "passport-google-oauth2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

env.config();

const app = express();
const port = process.env.PORT || 3000;

const saltRounds = 10;
let maxLength = 0;

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

app.use(
  session({
    secret: "TOPSECRETWORD",
    resave: false,
    saveUninitialized: true,
  })
);
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
  try {
    if (req.isAuthenticated()) {
      const result = await db.query("SELECT * FROM blogData ORDER BY id");
      const data = result.rows;
      maxLength = data.length;
      const user = await db.query("SELECT * FROM users WHERE user_id=$1", [
        req.user.user_id,
      ]);
      res.render("secrets.ejs", { data: data, user: user.rows[0].user_id });
    } else {
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
      res.redirect("/login");
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
            res.redirect("/show");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/delete/:id", async (req, res) => {
  try {
    const idToDelete = req.params.id;
    await db.query("DELETE FROM blogData WHERE id = $1", [idToDelete]);
  } catch (err) {
    console.error(err.stack);
  }
  res.redirect("/show");
});

app.get("/new", (req, res) => {
  res.render("modify.ejs", { maxLength: maxLength });
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/show",
    failureRedirect: "/login",
  })
);

app.get("/edit/:index", async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const result = await db.query(
      "SELECT title, description FROM blogData WHERE id=$1",
      [index]
    );
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
    const newData = {
      title: req.body.title,
      description: req.body.description,
    };
    const idToUpdate = req.params.id;
    await db.query(
      "UPDATE blogData SET title = $1, description = $2, crDate=CURRENT_DATE WHERE id = $3",
      [newData.title, newData.description, idToUpdate]
    );
  } catch (err) {
    console.error("Error executing query", err.stack);
  }
  res.redirect("/show");
});

app.post("/submitNew", async (req, res) => {
  try {
    const newData = {
      title: req.body.title,
      description: req.body.description,
      author: req.body.author,
      user_id: req.user.user_id,
    };
    await db.query(
      "INSERT INTO blogData(title, description, author, crdate, user_id) VALUES($1, $2, $3, CURRENT_DATE, $4)",
      [newData.title, newData.description, newData.author, newData.user_id]
    );
  } catch (err) {
    console.error("Error executing query", err.stack);
  }
  res.redirect("/show");
});

passport.use(
  "local",
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
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
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

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE email=$1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users(email,password) VALUES($1,$2)",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

export default app;

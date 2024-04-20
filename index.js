import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import cors from "cors";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(cors());

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.get("/", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.send("Welcome to to-do server");
});

app.post("/login", (req, res) => {
  console.log(req.body);
  // res.set("Access-Control-Allow-Origin", "*");
  // res.send('Got to login!');
  passport.authenticate("local", function (err, user, info, status) {
    
    if (user) {
      res.set("Access-Control-Allow-Origin", "*");
      res.send(user);
    } else {
      res.set("Access-Control-Allow-Origin", "*");
      res.send(null);
    }
  })(req, res);
});

app.post("/register", (req, res) => {
  console.log(req.body);
  res.set("Access-Control-Allow-Origin", "*");
  res.send("Got to register!");
});

passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      //   const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
      //     username,
      //   ]);
      //   if (result.rows.length > 0) {
      //     const user = result.rows[0];
      //     const storedHashedPassword = user.password;
      //     bcrypt.compare(password, storedHashedPassword, (err, valid) => {
      //       if (err) {
      //         console.error("Error comparing passwords:", err);
      //         return cb(err);
      //       } else {
      //         if (valid) {
      //           return cb(null, user);
      //         } else {
      //           return cb(null, false);
      //         }
      //       }
      //     });
      //   } else {
      //     return cb("User not found");
      //   }
      let user = {
        userId: "654321",
        fName: "",
        lName: "",
        userName: "Car",
        avatar: "",
        sharedLists: [2 /* this is a list id*/],
      };

      if (password == 1) {
        cb(null, user);
      } else {
        cb(null, null);
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});

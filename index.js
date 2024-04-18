import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import cors from 'cors';

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

app.get('/', (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.send('Welcome to to-do server');
})

app.post('/login', (req, res) => {
    console.log(req.body);
    res.set("Access-Control-Allow-Origin", "*");
    res.send('Got to login!');
});

app.post("/register", (req, res) => {
  console.log(req.body);
  res.set("Access-Control-Allow-Origin", "*");
  res.send("Got to register!");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
})
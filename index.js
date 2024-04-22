import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import cors from "cors";


const listsList = [
  {
    id: "1",
    title: "List 1",
    description: "A list of thing to do",
    items: [
      {
        id: "1",
        title: "Get milk",
        description: "Go to the store to get milk",
      },
      {
        id: "2",
        title: "Get dog food",
        description: "Go to store for dog food",
      },
      {
        id: "3",
        title: "Walk dog",
        description: "Take the dog outside for a walk",
      },
    ],
    owner: { userId: "123456", userName: "jon", avatar: "" },
    contributers: [],
    created: "2024-04-14T14:30:15.449Z",
    modified: "2024-04-14T14:38:15.449Z",
    modifiedBy: { userId: "123456", userName: "jon", avatar: "" },
  },
  {
    id: "2",
    title: "List 2",
    description: "A list of thing to do",
    items: [
      {
        id: "1",
        title: "Get cheese",
        description: "Go to the store to get cheese",
      },
      {
        id: "2",
        title: "Get cat food",
        description: "Go to store for cat food",
      },
      {
        id: "3",
        title: "Walk cat",
        description: "Take the cat outside for a walk",
      },
    ],
    owner: { userId: "123456", userName: "jon", avatar: "" },
    contributers: [{ userId: "654321", userName: "car", avatar: "" }],
    created: "2024-04-14T14:30:15.449Z",
    modified: "2024-04-14T14:38:15.449Z",
    modifiedBy: { userId: "123456", userName: "jon", avatar: "" },
  },
];


const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // one day length cookie
    },
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

app.get("/lists", async (req, res) => {
    
    console.log(req.session);
    if(req.isAuthenticated()) {
        res.send(listsList);
    }else{
        res.sendStatus(403);
    }
})

app.post("/login", async (req, res) => {
  console.log(req.body);
  
  passport.authenticate("local", function (err, user, info, status) {
    
    if (user) {
      
      req.login(user, (err) => {
        console.log(err);
        res.send(user);
      });
    } else {
      res.send(null);
    }
  })(req, res);
});

app.post("/register", async (req, res) => {
  console.log(req.body);
  // create new user logic
  res.send("Got to register!");
});

app.post("/logout", (req, res) => {
    console.log(req.body);
    res.clearCookie("connect.sid");
    req.logout(function (err) {
      console.log(err);
      req.session.destroy(function (err) {
        // destroys the session
        res.send();
      });
    });
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
        email: "test@test.com",
        username: "Test",
      };

      if (password == 1) {
        cb(null, user);
      } else {
        cb(null, false);
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

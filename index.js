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
  if (req.isAuthenticated()) {
    const userId = req.user.id;
    const usersLists = await db.query(
      "SELECT * FROM lists WHERE list_owner_id = $1",
      [userId]
    );
    res.status(200).send(usersLists.rows);
  } else {
    res.sendStatus(403);
  }
});

app.get("/lists/:listId", async (req, res) => {
  if (req.isAuthenticated) {
    const id = req.params.listId;

    // later convert this into one db call with a join, db is set up for it

    const list = await db.query("SELECT * FROM lists WHERE id = $1", [id]);

    const listItems = await db.query(
      "SELECT * FROM list_items WHERE list_id = $1",
      [id]
    );

    // rename list_id to listId for each item in the list
    const renamedListItems = listItems.rows.map((item) => {
      return {
        id: item.id,
        listId: item.list_id,
        title: item.title,
        description: item.description,
      };
    });

    list.rows[0].items = renamedListItems;

    res.status(200).send(list.rows[0]);
  } else {
    req.sendStatus(403);
  }
});

app.get("/friends", async (req, res) => {
  if (req.isAuthenticated) {
    const userId = req.user.id;
    const usersFriends = await db.query(
      `SElECT friends.id, friends.user_id, friends.friend_id, friends.approved, 
      users.username AS requesting, requested.username AS requested
      FROM friends 
      JOIN users ON friends.user_id = users.id 
      JOIN users requested ON friends.friend_id = requested.id
      WHERE user_id = $1 OR friend_id = $1`,
      [userId]
    );

    const camelCaseFriendsList = usersFriends.rows.map((friend) => {
      const camelCaseFriend = {
        id: friend.id,
        userId: friend.user_id,
        friendId: friend.friend_id,
        approved: friend.approved,
        requestingUser: friend.requesting,
        requestedUser: friend.requested,
        requestingAvatar: friend.requestingavatar,
        requestedAvatar: friend.requestedavatar
      };
      return camelCaseFriend;
    });

    res.status(200).send(camelCaseFriendsList);
  } else {
    res.sendStatus(403);
  }
});

app.post("/login", async (req, res) => {
  passport.authenticate("local", function (err, user, info, status) {
    if (user) {
      req.login(user, (err) => {
        console.log(err);
        res.send(user);
      });
    } else {
      res.sendStatus(404);
    }
  })(req, res);
});

app.post("/register", async (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;

  try {
    const checkEmailResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (checkEmailResult.rows.length > 0) {
      res.status(400).send("Email already exists, try loggin in.");
    } else {
      try {
        const checkUsernameResult = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        if (checkUsernameResult.rows.length > 0) {
          res.status(400).send("That username is taken, please choose another.");
        } else {
          // hash and salt the password then save to db
          bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) {
              console.error("Error hashing password: ", err);
            } else {
              try {
                const result = await db.query(
                  "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *",
                  [email, username, hash]
                );
                const user = result.rows[0];
                req.login(user, (err) => {
                  console.log(err);
                  res.send(user);
                });
              } catch (error) {
                res.send({ error: error }).status(500);
              }
            }
          });
        }
      } catch (error) {
        res.send({ error: error }).status(500);
      }
    }
  } catch (error) {
    res.send({ error: error }).status(500);
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("connect.sid");
  req.logout(function (err) {
    console.log(err);
    req.session.destroy(function (err) {
      // destroys the session
      res.send();
    });
  });
});

app.post("/lists", (req, res) => {
  if (req.isAuthenticated) {
    try {
      const newList = db.query(
        `INSERT INTO lists 
        (id, list_owner_id, title, description, created_date, modified_date, modified_by) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.body.id,
          req.body.owner.id,
          req.body.title,
          req.body.description,
          req.body.created,
          req.body.modified,
          req.body.modifiedBy.id,
        ]
      );
      res.sendStatus(200);
    } catch (error) {
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(403);
  }
});

app.post("/friends", async (req, res) => {
  if(req.isAuthenticated) {
    const requestData = req.body;
    const requestAction = requestData.action;
    const requestId = requestData.requestId;
    switch (requestAction) {
      case "cancel":
        try {
          await db.query("DELETE FROM friends WHERE id=$1", [requestId]);
          res.sendStatus(200)
        } catch (error) {
          console.log(`error canceling`);
        }
      case "approve":
        try {
          console.log("approve");
        } catch (error) {
          console.log(`error approving`);
        }
      case "deny":
        try {
          console.log("deny");
        } catch (error) {
          console.log(`error denying`);
        }
      default:
        console.log(`Error finding proper action.`);
        break;
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
})

app.put("/lists", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const updatedList = req.body;
      const id = updatedList.id;

      // update the list if there is anything in the list itself to be updated
      await db.query(
        "UPDATE lists SET id=$1, list_owner_id=$2, title=$3, description=$4, created_date=$5, modified_date=$6, modified_by=$7 WHERE id=$8",
        [
          id,
          updatedList.owner,
          updatedList.title,
          updatedList.description,
          updatedList.created,
          updatedList.modified,
          updatedList.modifiedBy,
          id,
        ]
      );

      // get the old list items so that they can be compared to the items in the new list
      const oldListItemsResponse = await db.query(
        "SELECT * FROM list_items WHERE list_id = $1",
        [id]
      );
      const oldListItems = oldListItemsResponse.rows;
      const newListItems = updatedList.items;

      // if there is a new item to add to the list, add it to the db
      if (oldListItems.length < newListItems.length) {
        const newItem = newListItems[newListItems.length - 1];
        await db.query(
          "INSERT INTO list_items (id, list_id, title, description) VALUES ($1, $2, $3, $4)",
          [newItem.id, newItem.listId, newItem.title, newItem.description]
        );
      }

      // if there are any modified list items, update them in the db
      for (let i = 0; i < oldListItems.length; i++) {
        let itemFromNew = newListItems.find(
          (item) => item.id === oldListItems[i].id
        );

        // there should never be an item in the old list that does not exist in the new list,
        // therefore we should always be able to find the old list item in the new list, if we
        // dont then there way and error and we send error status
        if (!itemFromNew) {
          res.sendStatus(500);
        }

        if (
          oldListItems[i].title !== itemFromNew.title ||
          oldListItems[i].description !== itemFromNew.description
        ) {
          await db.query(
            "UPDATE list_items SET id=$1, list_id=$2, title=$3, description=$4 WHERE id=$5",
            [
              itemFromNew.id,
              id,
              itemFromNew.title,
              itemFromNew.description,
              itemFromNew.id,
            ]
          );
        }
      }

      res.sendStatus(200);
    } catch (error) {
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(403);
  }
});

app.delete("/lists/:listId", async (req, res) => {
  if (req.isAuthenticated) {
    try {
      const listId = req.params.listId;
      await db.query(`DELETE FROM lists WHERE id= $1`, [listId]);
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(403);
  }
});

app.delete("/lists/:listId/:itemId", async (req, res) => {
  if (req.isAuthenticated) {
    try {
      const { listId, itemId } = req.params;
      const result = await db.query(
        "DELETE FROM list_items WHERE list_id = $1 and id = $2 RETURNING id",
        [listId, itemId]
      );
      const deletedId = result.rows[0].id;
      res.status(200).send(deletedId);
    } catch (error) {
      res.sendStatus(500);
    }
  } else {
    req.sendStatus(403);
  }
});

passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);

      if (result.rows.length > 0) {
        const user = {
          id: result.rows[0].id,
          email: result.rows[0].email,
          username: result.rows[0].username,
        };

        const storedHashedPassword = result.rows[0].password_hash;

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

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});

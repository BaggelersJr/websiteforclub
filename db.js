const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {

db.run("PRAGMA foreign_keys = ON");

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT
  )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  creator_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_private INTEGER DEFAULT 0,
  join_code TEXT,
  description TEXT,
  FOREIGN KEY (creator_id) REFERENCES users(id)
)
`);

db.run(`
    CREATE TABLE IF NOT EXISTS room_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, room_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);
`)

db.run(`
    CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`)

db.run(`CREATE INDEX IF NOT EXISTS idxmesroomid ON messages(room_id);`);
db.run(`CREATE INDEX IF NOT EXISTS idxmescreatedat ON messages(created_at);`);
db.run(`CREATE INDEX IF NOT EXISTS idxrmuserid ON room_members(user_id);`);
db.run(`CREATE INDEX IF NOT EXISTS idxrmroomid ON room_members(room_id);`);

});

module.exports = db;
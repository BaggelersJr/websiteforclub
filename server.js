const express = require("express");
const path = require("path");
const db = require("./db");
const app = express();
const PORT = 3000;
const bcrypt = require("bcrypt");
const session = require("express-session");

app.use(session({
    secret: "thekeyisverysecret123",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.get("/auth/me", (req, res) => {
    if (req.session?.userId) {
        return res.json({ loggedIn: true });
    }
    res.json({ loggedIn: false });
});

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
}

app.post("/signup", async (req, res) => {
    
    const email = req.body.email || null;
    const { username, password } = req.body;
    
    if (password.length < 8) {
        return res.json({ success: false, message: "Password must be at least 8 characters" });
    }   
    if (username.length < 3 || username.length > 20) {
        return res.json({ success: false, message: "Username must be between 3 and 20 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        return res.json({ success: false, message: "Invalid email format" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;

        db.run(sql, [email, username, hashedPassword], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE")) {
            return res.json({ success: false, message: "Username or email already exists" });
            }
            return res.json({ success: false, message: "Database error" });
        }

        res.json({ success: true });
        });

    } catch (error) {
        res.json({ success: false, message: "Server error" });
    }
    });

app.post("/login", (req, res) => {
    const { login, password } = req.body; 

    const sql = `SELECT * FROM users WHERE username = ? OR email = ?`;

    db.get(sql, [login, login], async (err, user) => {
        if (err || !user) {
        return res.json({ success: false, message: "Invalid credentials"});
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            req.session.userId = user.id;
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Invalid credentials"});
        }
    });
});

app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.json({ success: false, message: "Logout failed"});
        }
        res.json({ success: true });
    });
});

app.post("/rooms", requireAuth, (req, res) => {
    const { name, description } = req.body;
    const creatorId = req.session.userId;
    if (!name || name.trim().length < 3) {
        return res.json({ success: false, message: "Room name must be at least 3 characters"});
    }
    const desc = description ? description.trim() : null;

    if (desc && desc.length > 300) {
        return res.json({ success: false, message: "Description too long" });
    }
    const insert = `INSERT INTO rooms (name, description, creator_id) VALUES (?, ?, ?)`;
    db.run(insert, [name.trim(), desc, creatorId], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE")) {
                return res.json({ success: false, message: "Room name already exists"});
            }
            return res.json({ success: false, message: "Database error"});
        }
        const roomId = this.lastID;
        const insertm = `INSERT INTO room_members (user_id, room_id) VALUES (?, ?)`;
        db.run(insertm, [creatorId, roomId], (err2) => {
            if (err2) {
                return res.json({ success: false, message: "Room created but membership failed"});
            }
            res.json({ success: true, roomId });
        });
    });
});

app.get("/rooms", requireAuth, (req, res) => {
    const sql = `
        SELECT 
            r.id,
            r.name,
            r.description,
            r.created_at,
            u.username AS creator,
            COUNT(rm2.user_id) AS member_count
        FROM rooms r
        JOIN users u ON r.creator_id = u.id
        LEFT JOIN room_members rm2 ON r.id = rm2.room_id
        LEFT JOIN room_members rm_user 
            ON r.id = rm_user.room_id AND rm_user.user_id = ?
        WHERE rm_user.id IS NULL
        GROUP BY r.id
        ORDER BY r.created_at DESC
    `;

    db.all(sql, [req.session.userId], (err, rooms) => {
        if (err) {
            return res.json({ success: false, message: "Database error" });
        }
        res.json({ success: true, rooms });
    });
});


app.get("/my-rooms", requireAuth, (req, res) => {
    const sql = `SELECT r.id, r.name, r.description, r.created_at, u.username AS creator, COUNT(rm2.user_id) AS member_count
                    FROM rooms r
                    JOIN users u ON r.creator_id = u.id
                    JOIN room_members rm ON r.id = rm.room_id
                    LEFT JOIN room_members rm2 ON r.id = rm2.room_id
                    WHERE rm.user_id = ?
                    GROUP BY r.id
                    ORDER BY r.created_at DESC`;
    db.all(sql, [req.session.userId], (err, rooms) => {
        if (err) {
            return res.json({ success: false, message: "Database error"});
        }
        res.json({ success: true, rooms });
    });
});

app.post("/rooms/:id/join", requireAuth, (req, res) => {
    const roomId = parseInt(req.params.id);
    const userId = req.session.userId;

    if (!roomId) {
        return res.json({ success: false, message: "Invalid room" });
    }

    const checkRoom = `SELECT id FROM rooms WHERE id = ?`;

    db.get(checkRoom, [roomId], (err, room) => {
        if (err || !room) {
            return res.json({ success: false, message: "Room does not exist" });
        }

        const insert = `INSERT INTO room_members (user_id, room_id) VALUES (?, ?)`;

        db.run(insert, [userId, roomId], function (err2) {
            if (err2) {
                if (err2.message.includes("UNIQUE")) {
                    return res.json({ success: false, message: "Already a member" });
                }
                return res.json({ success: false, message: "Database error" });
            }

            res.json({ success: true });
        });
    });
});

app.post("/rooms/:id/messages", requireAuth, (req, res) => {
    const roomId = parseInt(req.params.id);
    const userId = req.session.userId;
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
        return res.json({ success: false, message: "Message cannot be empty" });
    }

    const checkmem = `SELECT id FROM room_members WHERE user_id = ? AND room_id = ?`;
    db.get(checkmem, [userId, roomId], (err, membership) => {
        if (err || !membership) {
            return res.json({ success: false, message: "Not a member of this room" });
        }
        const insert = `INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)`;
        db.run(insert, [roomId, userId, content.trim()], function (err2) {
            if (err2) {
                return res.json({ success: false, message: "Database error" });
            }
            res.json({ success: true, messageId: this.lastID });
        });
    });
});

app.get("/rooms/:id/messages", requireAuth, (req, res) => {
    const roomId = parseInt(req.params.id);
    const userId = req.session.userId;

    if (!roomId) {
        return res.json({ success: false, message: "Invalid room" });
    }

    const checkmem = `
        SELECT id FROM room_members 
        WHERE user_id = ? AND room_id = ?
    `;

    db.get(checkmem, [userId, roomId], (err, membership) => {
        if (err || !membership) {
            return res.json({ success: false, message: "Not a member of this room" });
        }

        const sql = `
            SELECT m.id, m.content, m.created_at, u.username AS author
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.room_id = ?
            ORDER BY m.created_at DESC
            LIMIT 50
        `;

        db.all(sql, [roomId], (err2, messages) => {
            if (err2) {
                return res.json({ success: false, message: "Database error" });
            }

            res.json({ success: true, messages });
        });
    });
});

app.get("/rooms/:id", requireAuth, (req, res) => {
    const roomId = parseInt(req.params.id);

    const sql = `
        SELECT 
            r.id,
            r.name,
            r.description,
            u.username AS creator,
            COUNT(rm.user_id) AS member_count
        FROM rooms r
        JOIN users u ON r.creator_id = u.id
        LEFT JOIN room_members rm ON r.id = rm.room_id
        WHERE r.id = ?
        GROUP BY r.id
    `;

    db.get(sql, [roomId], (err, room) => {
        if (err || !room) {
            return res.json({ success: false, message: "Room not found" });
        }

        res.json({ success: true, room });
    });
});



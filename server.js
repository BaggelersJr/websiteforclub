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

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {

  socket.on("joinRoom", (roomId) => {
    socket.join(`room-${roomId}`);
  });

  socket.on("newMessage", (data) => {
    io.to(`room-${data.roomId}`).emit("messageReceived", data);
  });

});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

function generateJoinCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

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

        LEFT JOIN room_members rm2
            ON r.id = rm2.room_id

        LEFT JOIN room_members rm_user
            ON r.id = rm_user.room_id
            AND rm_user.user_id = ?

        WHERE rm_user.user_id IS NULL
        AND r.is_private = 0

        GROUP BY r.id
        ORDER BY r.created_at DESC
    `;

    db.all(sql, [req.session.userId], (err, rooms) => {

        if (err) {
            return res.json({
                success: false,
                message: "Database error"
            });
        }

        res.json({
            success: true,
            rooms
        });
    });
});

app.post("/rooms", requireAuth, (req, res) => {
    const creatorId = req.session.userId;
    const { name, description } = req.body;
    const is_private = req.body.is_private === "on" || req.body.is_private === true;
    if (!name || name.trim().length < 3) {
        return res.json({
            success: false,
            message: "Room name must be at least 3 characters"
        });
    }
    const desc = description ? description.trim() : null;
    if (desc && desc.length > 300) {
        return res.json({
            success: false,
            message: "Description too long"
        });
    }
    const joinCode = is_private ? generateJoinCode() : null;
    const insert = `
        INSERT INTO rooms
        (name, description, is_private, join_code, creator_id)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.run(
        insert,
        [
            name.trim(),
            desc,
            is_private ? 1 : 0,
            joinCode,
            creatorId
        ],
        function (err) {
            if (err) {
                if (err.message.includes("UNIQUE")) {
                    return res.json({
                        success: false,
                        message: "Room name already exists"
                    });
                }
                return res.json({
                    success: false,
                    message: "Database error"
                });
            }
            const roomId = this.lastID;
            db.run(
                `INSERT INTO room_members (user_id, room_id) VALUES (?, ?)`,
                [creatorId, roomId],
                (err2) => {
                    if (err2) {
                        return res.json({
                            success: false,
                            message: "Room created but membership failed"
                        });
                    }
                    res.json({
                        success: true,
                        roomId,
                        joinCode
                    });
                }
            );
        }
    );
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

    const checkmem = `
        SELECT id FROM room_members 
        WHERE user_id = ? AND room_id = ?
    `;

    db.get(checkmem, [userId, roomId], (err, membership) => {
        if (err || !membership) {
            return res.json({ success: false, message: "Not a member of this room" });
        }

        const insert = `
            INSERT INTO messages (room_id, user_id, content)
            VALUES (?, ?, ?)
        `;

        db.run(insert, [roomId, userId, content.trim()], function (err2) {
            if (err2) {
                return res.json({ success: false, message: "Database error" });
            }

            db.get(
                `SELECT username FROM users WHERE id = ?`,
                [userId],
                (err3, user) => {
                    if (err3 || !user) {
                        return res.json({
                            success: true,
                            messageId: this.lastID,
                            author: "Unknown"
                        });
                    }
                    res.json({
                        success: true,
                        messageId: this.lastID,
                        author: user.username
                    });
                }
            );
        });
    });
});

app.get("/rooms/:id/messages", requireAuth, (req, res) => {
    const roomId = parseInt(req.params.id);
    const userId = req.session.userId;

    if (!roomId) {
        return res.json({ success: false, message: "Invalid room" });
    }

    const roomSql = `
        SELECT *
        FROM rooms
        WHERE id = ?
    `;

    db.get(roomSql, [roomId], (err, room) => {
        if (err || !room) {
            return res.json({ success: false, message: "Room not found" });
        }

        const membershipSql = `
            SELECT id FROM room_members
            WHERE user_id = ? AND room_id = ?
        `;

        db.get(membershipSql, [userId, roomId], (err2, membership) => {
            if (err2 || !membership) {
                return res.json({ success: false, message: "Not a member" });
            }

            const messagesSql = `
                SELECT m.id, m.content, m.created_at, u.username AS author
                FROM messages m
                JOIN users u ON m.user_id = u.id
                WHERE m.room_id = ?
                ORDER BY m.created_at DESC
                LIMIT 100
            `;

            db.all(messagesSql, [roomId], (err3, messages) => {
                if (err3) {
                    return res.json({ success: false, message: "Database error" });
                }

                res.json({
                    success: true,
                    room,
                    currentUserId: userId,
                    messages
                });
            });
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
            r.join_code,
            r.is_private,
            r.creator_id,
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

        res.json({
            success: true,
            room,
            currentUserId: req.session.userId
        });
    });
});

app.post("/rooms/join-code", requireAuth, (req, res) => {

    const { code } = req.body;
    const userId = req.session.userId;

    const findRoom = `SELECT id FROM rooms WHERE join_code = ?`;

    db.get(findRoom, [code], (err, room) => {

        if (err || !room) {
        return res.json({
            success: false,
            message: "Invalid join code"
        });
        }

        const insert = `
        INSERT INTO room_members (user_id, room_id)
        VALUES (?, ?)
        `;

        db.run(insert, [userId, room.id], function(err2){

        if (err2 && err2.message.includes("UNIQUE")) {
            return res.json({
            success: true,
            roomId: room.id
            });
        }

        if (err2) {
            return res.json({
            success:false,
            message:"Database error"
            });
        }

        res.json({
            success:true,
            roomId: room.id
      });
    });
  });
});

app.get("/profile", requireAuth, (req, res) => {
    const userId = req.session.userId;

    const userSql = `SELECT id, username, email FROM users WHERE id = ?`;
    const roomsSql = `
        SELECT r.id, r.name
        FROM rooms r
        JOIN room_members rm ON r.id = rm.room_id
        WHERE rm.user_id = ?
    `;

    db.get(userSql, [userId], (err, user) => {
        if (err || !user) {
            return res.json({ success: false });
        }

        db.all(roomsSql, [userId], (err2, rooms) => {
            if (err2) {
                return res.json({ success: false });
            }

            res.json({ success: true, user, rooms });
        });
    });
});

app.get("/profile/rooms", requireAuth, (req, res) => {
    const sql = `
        SELECT r.id, r.name, r.description, r.created_at
        FROM rooms r
        JOIN room_members rm ON r.id = rm.room_id
        WHERE rm.user_id = ?
        ORDER BY r.created_at DESC
    `;

    db.all(sql, [req.session.userId], (err, rooms) => {
        if (err) {
            return res.json({ success: false, message: "Database error" });
        }

        res.json({ success: true, rooms });
    });
});

app.get("/profile/info", requireAuth, (req, res) => {
    const sql = `SELECT id, username, email FROM users WHERE id = ?`;

    db.get(sql, [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user });
    });
});

app.get("/profile/rooms", requireAuth, (req, res) => {
    const sql = `
        SELECT r.id, r.name, r.description, r.created_at
        FROM rooms r
        JOIN room_members rm ON r.id = rm.room_id
        WHERE rm.user_id = ?
        ORDER BY r.created_at DESC
    `;

    db.all(sql, [req.session.userId], (err, rooms) => {
        if (err) {
            return res.json({ success: false, message: "Database error" });
        }

        res.json({ success: true, rooms });
    });
});

app.get("/rooms/:id/edit", requireAuth, (req, res) => {
    const roomId = parseInt(req.params.id);

    const sql = `
        SELECT *
        FROM rooms
        WHERE id = ? AND creator_id = ?
    `;

    db.get(sql, [roomId, req.session.userId], (err, room) => {
        if (err || !room) {
            return res.json({ success: false, message: "Unauthorized or not found" });
        }
        if (err || !room) {
        return res.json({ success: false, message: "Unauthorized or not found" });
        }
        res.json({ success: true, room });
    });
});

app.post("/rooms/:id/edit", requireAuth, (req, res) => {
    const roomId = parseInt(req.params.id);
    const { name, description, is_private } = req.body;

    const sql = `
        UPDATE rooms
        SET name = ?, description = ?, is_private = ?
        WHERE id = ? AND creator_id = ?
    `;

    db.run(
        sql,
        [
            name,
            description,
            is_private ? 1 : 0,
            roomId,
            req.session.userId
        ],
        function (err) {
            if (err) {
                return res.json({ success: false, message: "Update failed" });
            }

            res.json({ success: true });
        }
    );
});

app.get("/rooms/:id/members", requireAuth, (req, res) => {
    const roomId = parseInt(req.params.id);

    const sql = `
        SELECT u.id, u.username, rm.role, rm.joined_at
        FROM room_members rm
        JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id = ?
        ORDER BY 
            CASE WHEN rm.role = 'owner' THEN 0 ELSE 1 END,
            rm.joined_at ASC
    `;

    db.all(sql, [roomId], (err, members) => {

        if (err) {
            console.error("Members Query Error:", err.message);
            return res.json({
                success: false,
                message: err.message
            });
        }

        res.json({
            success: true,
            members
        });
    });
});


app.post("/rooms/:id/leave", requireAuth, (req, res) => {
    const roomId = parseInt(req.params.id);
    const userId = req.session.userId;
    const checkOwner = `SELECT creator_id FROM rooms WHERE id = ?`;
    db.get(checkOwner, [roomId], (err, room) => {
        if (err || !room) {
            return res.json({ success: false, message: "Room not found" });
        }

        if (room.creator_id === userId) {
            return res.json({ success: false, message: "Owner cannot leave the room" });
        }

        const deleteMember = `DELETE FROM room_members WHERE room_id = ? AND user_id = ?`;
        db.run(deleteMember, [roomId, userId], function(err2) {
            if (err2) {
                return res.json({ success: false, message: "Failed to leave room" });
            }
            res.json({ success: true });
        });
    });
});

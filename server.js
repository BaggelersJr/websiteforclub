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
        return res.json({ success: false, message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            req.session.userId = user.id;
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    });
});

app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.json({ success: false, message: "Logout failed" });
        }
        res.json({ success: true });
    });
});



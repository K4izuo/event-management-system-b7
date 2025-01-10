const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const port = 10000;

// Database configuration
const dbConfig = {
  host: "sql12.freesqldatabase.com",
  user: "sql12756942",
  password: "6n6QvU94hA",
  database: "sql12756942",
  port: 3306
};

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'https://K4izuo.github.io'],
  credentials: true
}));

// Database connection
const db = mysql.createConnection(dbConfig);

function handleDisconnect() {
  db.on('error', function(err) {
    console.log('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Reconnecting to database...');
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    setTimeout(handleDisconnect, 2000);
    return;
  }
  console.log("Connected to MySQL database");
});

// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const findUser = () => {
      return new Promise((resolve, reject) => {
        const query = "SELECT * FROM users WHERE email = ?";
        db.query(query, [email], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    const users = await findUser();

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login. Please try again.",
    });
  }
});

// Register endpoint
app.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const checkUser = () => {
      return new Promise((resolve, reject) => {
        const checkUserQuery = "SELECT * FROM users WHERE email = ?";
        db.query(checkUserQuery, [email], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    const existingUser = await checkUser();

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const insertUser = () => {
      return new Promise((resolve, reject) => {
        const insertUserQuery = "INSERT INTO users (Name, email, password) VALUES (?, ?, ?)";
        const values = [fullName, email, hashedPassword];

        db.query(insertUserQuery, values, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    await insertUser();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during registration. Please try again.",
    });
  }
});

// Logout endpoint
app.post("/logout", async (req, res) => {
  try {
    // Since we're not using sessions, we'll just send a success response
    // The frontend will handle clearing local storage
    
    // You could add additional cleanup here if needed, such as:
    // - Invalidating tokens if you implement token-based auth
    // - Clearing any server-side sessions if you implement session management
    // - Logging the logout event in your database
    
    const logLogout = () => {
      return new Promise((resolve, reject) => {
        const query = "INSERT INTO user_logs (action_type, timestamp) VALUES (?, NOW())";
        db.query(query, ['logout'], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    await logLogout();

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during logout. Please try again."
    });
  }
});

// Event endpoints
app.post("/send-event", async (req, res) => {
  try {
    const { title, date, time, location, attendees, description, category, status } = req.body;

    if (!title || !date || !time || !location || !attendees || !description || !category || !status) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const checkEvent = () => {
      return new Promise((resolve, reject) => {
        const checkEventQuery = "SELECT * FROM events WHERE title = ?";
        db.query(checkEventQuery, [title], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    const existingEvent = await checkEvent();

    if (existingEvent.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Event already exists",
      });
    }

    const insertEvent = () => {
      return new Promise((resolve, reject) => {
        const insertEventQuery = "INSERT INTO events (title, date, time, location, attendees, description, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const values = [title, date, time, location, attendees, description, category, status];

        db.query(insertEventQuery, values, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    await insertEvent();

    return res.status(201).json({
      success: true,
      message: "Event added successfully",
    });
  } catch (error) {
    console.error("Event error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during event creation. Please try again.",
    });
  }
});

app.get("/events-data", async (req, res) => {
  try {
    const getEvents = () => {
      return new Promise((resolve, reject) => {
        const query = "SELECT * FROM events ORDER BY title DESC";
        db.query(query, (err, result) => {
          if (err) {
            reject(err);
          } else {
            const formattedEvents = result.map(event => {
              const date = new Date(event.date);
              return {
                ...event,
                date: date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: '2-digit'
                }),
                time: date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }).toLowerCase()
              };
            });
            resolve(formattedEvents);
          }
        });
      });
    };
    
    const events = await getEvents();
    return res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Event retrieval error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving events. Please try again.",
    });
  }
});

app.put("/update-event/:event_id", async (req, res) => {

  try {
    const { id, title, date, time, location, attendees, description, category, status } = req.body;
    const query =
      "UPDATE events SET title = ?, date = ?, time = ?, location = ?, attendees = ?, description = ?, category = ?, status = ? WHERE id = ?";
    db.query(query, [title, date, time, location, attendees, description, category, status, id],
      function (err, results) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "An error occurred during event update. Please try again.",
          });
        }
        res.status(200).json({
          success: true,
          message: "Event updated successfully",
        });
      }
    );
  } catch (error) {
    console.error("Event update error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during event update. Please try again.",
    });
  }
});

app.delete("/delete-event/:event_id", async (req, res) => {
  try {
    const eventId = req.params.event_id;
    const query = "DELETE FROM events WHERE id = ?";
    db.query(query, [eventId], function (err, results) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "An error occurred during event deletion. Please try again.",
        });
      }
      res.status(200).json({
        success: true,
        message: "Event deleted successfully",
      });
    });
  } catch (error) {
    console.error("Event deletion error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during event deletion. Please try again.",
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) {
      return res.status(500).json({ 
        status: "error",
        message: "Database connection failed"
      });
    }
    res.status(200).json({ 
      status: "ok",
      message: "Server and database connection healthy"
    });
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

// Error handling
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

module.exports = app;
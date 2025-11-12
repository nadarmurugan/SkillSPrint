// backend/server.js - UPDATED WITH REFLECTION MARKING SYSTEM

import http from "http";
import url from "url";
import { StringDecoder } from "string_decoder";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import connection from "./db.js"; // Your existing MySQL connection module
import * as fs from "fs"; 
import * as path from "path"; 
// -----------------------------------------------------------

dotenv.config();

const PORT = process.env.PORT || 5050;
const API_BASE = "api";
const RESOURCE_SPRINTS = "sprints";
const RESOURCE_USERS = "users";
const RESOURCE_LESSONS = "lessons";
const RESOURCE_PROGRESS = "progress"; 
const RESOURCE_NOTES = "notes"; 
const RESOURCE_CATEGORIES = "categories"; 
const RESOURCE_REFLECTIONS = "reflections"; // NEW: Reflection resource
// ----------------------

// Define the absolute path to your uploads directory
const UPLOADS_DIR = path.join(path.resolve(), 'uploads'); 
// Define the directory where your front-end build resides (e.g., 'dist' or 'build')
const FRONTEND_DIR = path.join(path.resolve(), '../frontend/dist'); 
console.log(`🎥 Static files will be served from: ${UPLOADS_DIR}`);
// -------------------------------------------------------------

const server = http.createServer((req, res) => {
    // Handle CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id"); 

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathUrl = parsedUrl.pathname.replace(/^\/+|\/+$/g, "").toLowerCase(); 
    const pathSegments = pathUrl.split("/");
    const decoder = new StringDecoder("utf-8");
    let buffer = "";

    req.on("data", (data) => {
        buffer += decoder.write(data);
    });

    req.on("end", () => {
        buffer += decoder.end();

        // Helper function to send JSON response
        const sendResponse = (statusCode, data) => {
            res.writeHead(statusCode, { "Content-Type": "application/json" });
            res.end(JSON.stringify(data));
        };
        
        // Validate and sanitize the user ID header
        const userIdHeader = req.headers["x-user-id"];
        const userId = userIdHeader ? parseInt(userIdHeader, 10) : null; 
        
        // Helper for authentication check
        const authenticate = () => {
            if (!userId || isNaN(userId) || userId <= 0) {
                sendResponse(401, { error: "Authentication required. X-User-Id header is missing or invalid." });
                return false;
            }
            return true;
        };

        // Helper for admin authorization check
        const authorizeAdmin = (callback) => {
            const checkAdminQuery = "SELECT role FROM users WHERE id = ?";
            connection.query(checkAdminQuery, [userId], (err, results) => {
                if (err || results.length === 0 || results[0].role !== 'admin') {
                    sendResponse(403, { error: "Admin access required" });
                    return;
                }
                callback();
            });
        };
        
        
        // ------------------------------------
        // --- 1. STATIC FILE SERVING ROUTES ---
        // ------------------------------------
        
        // Handle requests for /uploads/* (Video/Static Files)
        if (pathSegments[0] === "uploads" && req.method === "GET") {
            const filePathSegment = pathSegments.slice(1).join('/');
            const absoluteFilePath = path.join(UPLOADS_DIR, filePathSegment);

            fs.stat(absoluteFilePath, (err, stats) => {
                if (err) {
                    console.error(`File serving error for ${absoluteFilePath}:`, err);
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("File Not Found");
                    return;
                }

                const totalSize = stats.size;
                const range = req.headers.range;
                const mimeType = path.extname(absoluteFilePath).toLowerCase() === '.mp4' ? 'video/mp4' : 'application/octet-stream';
                
                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
                    const chunkSize = (end - start) + 1;

                    const headers = {
                        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunkSize,
                        'Content-Type': mimeType, 
                    };

                    res.writeHead(206, headers);
                    fs.createReadStream(absoluteFilePath, { start, end }).pipe(res);
                } else {
                    const headers = {
                        'Content-Length': totalSize,
                        'Content-Type': mimeType,
                    };
                    res.writeHead(200, headers);
                    fs.createReadStream(absoluteFilePath).pipe(res);
                }
            });
            return; 
        }
        
        // -----------------------
        // --- 2. AUTH ROUTES ------
        // -----------------------

        // LOGIN: /login (POST)
        else if (pathUrl === "login" && req.method === "POST") {
            try {
                const { email, password } = JSON.parse(buffer);
                // Ensure 'role' is selected for successful login response
                connection.query("SELECT id, name, email, password, role FROM users WHERE email = ?", [email], async (err, results) => {
                    if (err) return sendResponse(500, { error: "Database error" });
                    if (results.length === 0) return sendResponse(400, { error: "User not found" });

                    const user = results[0];
                    const match = await bcrypt.compare(password, user.password);

                    if (match) {
                        // Ensure 'role' is included in the safe user object
                        const { password, ...safeUser } = user;
                        sendResponse(200, { message: "Login successful", user: safeUser });
                    } else {
                        sendResponse(401, { error: "Invalid credentials" });
                    }
                });
            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input" });
            }
        }

        // SIGNUP: /signup (POST)
        else if (pathUrl === "signup" && req.method === "POST") {
            try {
                const { name, email, password } = JSON.parse(buffer);
                if (!name || !email || !password) return sendResponse(400, { error: "Name, email, and password are required." });

                connection.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
                    if (err) return sendResponse(500, { error: "Database error" });
                    if (results.length > 0) return sendResponse(400, { error: "Email already exists" });

                    const hashedPassword = await bcrypt.hash(password, 10);

                    // Insert query relies on the 'role' column having a default value 'user' 
                    connection.query(
                        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                        [name, email, hashedPassword],
                        (insertErr) => {
                            if (insertErr) {
                                console.error("Signup insert error:", insertErr);
                                sendResponse(500, { error: "Failed to register user" });
                            } else {
                                sendResponse(201, { message: "Signup successful" });
                            }
                        }
                    );
                });
            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input" });
            }
        }
        
        // ------------------------------------
        // --- 3. PROGRESS TRACKING ROUTES (/api/progress) ---
        // ------------------------------------
        
        // GET ALL PROGRESS FOR A USER: /api/progress (GET)
        else if (pathUrl === `${API_BASE}/${RESOURCE_PROGRESS}` && req.method === "GET") {
            if (!authenticate()) return;

            const query = "SELECT sprint_id, progress_percentage, is_completed FROM sprint_progress WHERE user_id = ?";
            connection.query(query, [userId], (err, results) => {
                if (err) {
                    console.error("Error fetching progress:", err);
                    return sendResponse(500, { error: "Failed to fetch user progress." });
                }
                const progressMap = results.reduce((acc, curr) => {
                    acc[`dynamic-sprint-${curr.sprint_id}`] = {
                        progress: curr.progress_percentage,
                        completed: curr.is_completed === 1,
                    };
                    return acc;
                }, {});
                sendResponse(200, progressMap);
            });
        }
        
        // SAVE/UPDATE PROGRESS: /api/progress (POST or PUT) - Uses UPSERT
        else if (pathUrl === `${API_BASE}/${RESOURCE_PROGRESS}` && (req.method === "POST" || req.method === "PUT")) {
            if (!authenticate()) return;

            try {
                const { sprint_id: sprintId, progress_percentage: progressPercent, is_completed: isCompleted } = JSON.parse(buffer);
                
                if (!sprintId || progressPercent === undefined || isCompleted === undefined) {
                    return sendResponse(400, { error: "sprintId, progressPercent, and isCompleted are required." });
                }

                const completedStatus = isCompleted ? 1 : 0;
                
                // FIX APPLIED: Reformat SQL template literal to prevent ER_PARSE_ERROR (Previous issue)
                const query = `
INSERT INTO sprint_progress 
    (user_id, sprint_id, progress_percentage, is_completed)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE 
    progress_percentage = VALUES(progress_percentage), 
    is_completed = VALUES(is_completed);
                `.trim(); 
                
                connection.query(
                    query,
                    [userId, sprintId, progressPercent, completedStatus],
                    (err) => {
                        if (err) {
                            // Enhanced error handling for database issues (Foreign Key Constraint failure)
                            console.error("❌ Database Error saving progress:", err);
                            if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_BAD_NULL_ERROR') {
                                // This specific message usually means the user_id or sprint_id is missing/invalid.
                                return sendResponse(400, { error: "Validation failed: Sprint or User ID does not exist. (Foreign Key Check Failed)" });
                            }
                            return sendResponse(500, { error: "Failed to save sprint progress. Database error logged on server." });
                        }
                        sendResponse(200, { message: "Progress saved successfully" });
                    }
                );
            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input for progress update." });
            }
        }

        // ------------------------------------
        // --- 4. LESSON REFLECTION ROUTES (NEW) ---
        // ------------------------------------

        // GET reflection for a lesson: /api/lessons/:id/reflection (GET)
        else if (
            pathSegments.length === 4 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_LESSONS &&
            pathSegments[3] === "reflection" &&
            req.method === "GET"
        ) {
            if (!authenticate()) return;

            const lessonId = pathSegments[2];
            const query = `
                SELECT id, reflection_text, status, score, admin_feedback, 
                       submitted_at, marked_at, created_at, updated_at
                FROM lesson_reflections 
                WHERE user_id = ? AND lesson_id = ?
            `;
            
            connection.query(query, [userId, lessonId], (err, results) => {
                if (err) {
                    console.error("Error fetching lesson reflection:", err);
                    return sendResponse(500, { error: "Failed to fetch reflection" });
                }
                
                if (results.length === 0) {
                    return sendResponse(200, { 
                        reflection_text: "", 
                        status: "draft", 
                        score: null, 
                        admin_feedback: null,
                        submitted_at: null,
                        marked_at: null
                    });
                }
                
                sendResponse(200, results[0]);
            });
        }

        // SAVE/UPDATE reflection (draft): /api/lessons/:id/reflection (POST)
        else if (
            pathSegments.length === 4 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_LESSONS &&
            pathSegments[3] === "reflection" &&
            req.method === "POST"
        ) {
            if (!authenticate()) return;

            const lessonId = pathSegments[2];
            try {
                const { reflection_text } = JSON.parse(buffer);
                
                if (!reflection_text) {
                    return sendResponse(400, { error: "Reflection text is required" });
                }

                const upsertQuery = `
                    INSERT INTO lesson_reflections (user_id, lesson_id, reflection_text, status)
                    VALUES (?, ?, ?, 'draft')
                    ON DUPLICATE KEY UPDATE 
                        reflection_text = VALUES(reflection_text),
                        status = 'draft',
                        updated_at = NOW()
                `;
                
                connection.query(upsertQuery, [userId, lessonId, reflection_text], (err, result) => {
                    if (err) {
                        console.error("Error saving reflection:", err);
                        return sendResponse(500, { error: "Failed to save reflection" });
                    }
                    sendResponse(200, { message: "Reflection saved as draft" });
                });
            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input" });
            }
        }

        // SUBMIT reflection for marking: /api/lessons/:id/reflection/submit (POST)
        else if (
            pathSegments.length === 5 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_LESSONS &&
            pathSegments[3] === "reflection" &&
            pathSegments[4] === "submit" &&
            req.method === "POST"
        ) {
            if (!authenticate()) return;

            const lessonId = pathSegments[2];
            try {
                const { reflection_text } = JSON.parse(buffer);
                
                if (!reflection_text?.trim()) {
                    return sendResponse(400, { error: "Reflection text cannot be empty" });
                }

                const submitQuery = `
                    INSERT INTO lesson_reflections (user_id, lesson_id, reflection_text, status, submitted_at)
                    VALUES (?, ?, ?, 'submitted', NOW())
                    ON DUPLICATE KEY UPDATE 
                        reflection_text = VALUES(reflection_text),
                        status = 'submitted',
                        submitted_at = NOW(),
                        updated_at = NOW()
                `;
                
                connection.query(submitQuery, [userId, lessonId, reflection_text], (err, result) => {
                    if (err) {
                        console.error("Error submitting reflection:", err);
                        return sendResponse(500, { error: "Failed to submit reflection" });
                    }
                    sendResponse(200, { message: "Reflection submitted for marking" });
                });
            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input" });
            }
        }

        // RESUBMIT reflection: /api/lessons/:id/reflection/resubmit (POST)
        else if (
            pathSegments.length === 5 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_LESSONS &&
            pathSegments[3] === "reflection" &&
            pathSegments[4] === "resubmit" &&
            req.method === "POST"
        ) {
            if (!authenticate()) return;

            const lessonId = pathSegments[2];
            try {
                const { reflection_text } = JSON.parse(buffer);
                
                if (!reflection_text?.trim()) {
                    return sendResponse(400, { error: "Reflection text cannot be empty" });
                }

                const resubmitQuery = `
                    UPDATE lesson_reflections 
                    SET reflection_text = ?, status = 'submitted', submitted_at = NOW(), updated_at = NOW()
                    WHERE user_id = ? AND lesson_id = ?
                `;
                
                connection.query(resubmitQuery, [reflection_text, userId, lessonId], (err, result) => {
                    if (err) {
                        console.error("Error resubmitting reflection:", err);
                        return sendResponse(500, { error: "Failed to resubmit reflection" });
                    }
                    
                    if (result.affectedRows === 0) {
                        return sendResponse(404, { error: "Reflection not found" });
                    }
                    
                    sendResponse(200, { message: "Reflection resubmitted for marking" });
                });
            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input" });
            }
        }

        // ADMIN: Get all submitted reflections: /api/reflections/submitted (GET)
        else if (
            pathUrl === `${API_BASE}/${RESOURCE_REFLECTIONS}/submitted` &&
            req.method === "GET"
        ) {
            if (!authenticate()) return;

            authorizeAdmin(() => {
                const query = `
                    SELECT lr.*, u.name as user_name, u.email as user_email, 
                           l.title as lesson_title, l.description as lesson_description
                    FROM lesson_reflections lr
                    JOIN users u ON lr.user_id = u.id
                    JOIN lessons l ON lr.lesson_id = l.id
                    WHERE lr.status = 'submitted'
                    ORDER BY lr.submitted_at ASC
                `;
                
                connection.query(query, (err, results) => {
                    if (err) {
                        console.error("Error fetching submitted reflections:", err);
                        return sendResponse(500, { error: "Failed to fetch submitted reflections" });
                    }
                    sendResponse(200, results);
                });
            });
        }

        // ADMIN: Mark reflection: /api/reflections/mark (POST)
        else if (
            pathSegments.length === 3 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_REFLECTIONS &&
            pathSegments[2] === "mark" &&
            req.method === "POST"
        ) {
            if (!authenticate()) return;

            authorizeAdmin(() => {
                try {
                    const { reflection_id, score, admin_feedback, status } = JSON.parse(buffer);
                    
                    if (!reflection_id || score === undefined || !admin_feedback) {
                        return sendResponse(400, { error: "Reflection ID, score, and feedback are required" });
                    }

                    if (score < 0 || score > 10) {
                        return sendResponse(400, { error: "Score must be between 0 and 10" });
                    }

                    const validStatuses = ['marked', 'rejected'];
                    if (!validStatuses.includes(status)) {
                        return sendResponse(400, { error: "Status must be 'marked' or 'rejected'" });
                    }

                    const markQuery = `
                        UPDATE lesson_reflections 
                        SET score = ?, admin_feedback = ?, status = ?, marked_at = NOW(), updated_at = NOW()
                        WHERE id = ?
                    `;
                    
                    connection.query(markQuery, [score, admin_feedback, status, reflection_id], (err, result) => {
                        if (err) {
                            console.error("Error marking reflection:", err);
                            return sendResponse(500, { error: "Failed to mark reflection" });
                        }
                        
                        if (result.affectedRows === 0) {
                            return sendResponse(404, { error: "Reflection not found" });
                        }
                        
                        sendResponse(200, { message: "Reflection marked successfully" });
                    });
                } catch (err) {
                    sendResponse(400, { error: "Invalid JSON input" });
                }
            });
        }
        
        // ------------------------------------
        // --- 5. USER NOTES ROUTES (/api/notes) ---
        // ------------------------------------

        // GET NOTES FOR A USER/CONTENT: /api/notes/:contentType/:contentId (GET)
        else if (
            pathSegments.length === 4 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_NOTES &&
            req.method === "GET"
        ) {
            if (!authenticate()) return;

            const contentType = pathSegments[2];
            const contentId = pathSegments[3]; 

            const query = "SELECT note_text FROM user_notes WHERE user_id = ? AND content_type = ? AND content_id = ?";
            connection.query(query, [userId, contentType, contentId], (err, results) => {
                if (err) {
                    console.error("Error fetching notes:", err);
                    return sendResponse(500, { error: "Failed to fetch user notes." });
                }
                
                const note = results.length > 0 ? results[0].note_text : "";
                sendResponse(200, { note_text: note });
            });
        }
        
        // SAVE/UPDATE NOTE: /api/notes (POST or PUT) - Uses UPSERT
        else if (pathUrl === `${API_BASE}/${RESOURCE_NOTES}` && (req.method === "POST" || req.method === "PUT")) {
            if (!authenticate()) return;

            try {
                const { contentType, contentId, noteText } = JSON.parse(buffer);
                
                if (!contentType || contentId === undefined || noteText === undefined) {
                    return sendResponse(400, { error: "contentType, contentId, and noteText are required." });
                }
                
                // FIX: SQL Template Literal Reformatted to prevent ER_PARSE_ERROR (Previous issue)
                const upsertQuery = `
INSERT INTO user_notes (user_id, content_type, content_id, note_text) 
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE 
note_text = VALUES(note_text),
updated_at = NOW();
                `.trim(); 

                connection.query(upsertQuery, [userId, contentType, contentId, noteText], (err) => {
                    if (err) {
                        console.error(`❌ Database Error saving note (Code: ${err.code}):`, err.message);
                        
                        let clientError = "Failed to save user note (Database error). Please check server logs.";
                        
                        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_BAD_NULL_ERROR') {
                            clientError = "Error saving note: Validation failed. Content or User ID does not exist. (Foreign Key Check Failed)";
                        } else if (err.code === 'ER_DUP_ENTRY') {
                            clientError = "Error saving note: Duplicate content entry. (Unique Key Check Failed)";
                        } 
                        
                        return sendResponse(500, { error: clientError });
                    }
                    sendResponse(200, { message: "Note saved successfully" });
                });

            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input for note update." });
            }
        }
        
        // ------------------------------------
        // --- 6. SPRINT MANAGEMENT ROUTES ---
        // ------------------------------------

        // GET ALL SPRINTS: /api/sprints (GET)
        else if (pathUrl === `${API_BASE}/${RESOURCE_SPRINTS}` && req.method === "GET") {
            const query = "SELECT id, title, description, video_url, max_duration_seconds, is_active, thumbnail_url FROM sprints ORDER BY created_at DESC";
            connection.query(query, (err, results) => {
                if (err) {
                    console.error("Error fetching sprints:", err);
                    return sendResponse(500, { error: "Failed to fetch sprints." });
                }
                const sprints = results.map(s => ({ ...s, is_active: s.is_active === 1 }));
                sendResponse(200, sprints);
            });
        }

        // CREATE NEW SPRINT: /api/sprints (POST)
        else if (pathUrl === `${API_BASE}/${RESOURCE_SPRINTS}` && req.method === "POST") {
            try {
                const { title, description, video_url, max_duration_minutes, thumbnail_url } = JSON.parse(buffer);

                if (!title || !description || !video_url || max_duration_minutes === undefined) {
                    return sendResponse(400, { error: "Title, description, video URL (or simulated path), and max duration are required." });
                }

                let maxDurationSeconds = parseInt(max_duration_minutes, 10) * 60;
                if (isNaN(maxDurationSeconds) || maxDurationSeconds <= 0) maxDurationSeconds = 600;
                if (maxDurationSeconds > 3600) maxDurationSeconds = 3600;

                const insertQuery = "INSERT INTO sprints (title, description, video_url, max_duration_seconds, is_active, thumbnail_url) VALUES (?, ?, ?, ?, ?, ?)";
                connection.query(
                    insertQuery,
                    [title, description, video_url, maxDurationSeconds, 0, thumbnail_url || null],
                    (err, result) => {
                        if (err) {
                            console.error("Error creating new sprint:", err);
                            return sendResponse(500, { error: "Failed to create new sprint in database." });
                        }
                        sendResponse(201, {
                            message: "Sprint created successfully",
                            id: result.insertId,
                            title,
                            description,
                            video_url,
                            max_duration_seconds: maxDurationSeconds,
                            is_active: false,
                            thumbnail_url: thumbnail_url || null
                        });
                    }
                );
            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input for sprint creation." });
            }
        }

        // DELETE SPRINT: /api/sprints/:id (DELETE)
        else if (
            pathSegments.length === 3 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_SPRINTS &&
            req.method === "DELETE"
        ) {
            const sprintId = pathSegments[2];
            connection.query("DELETE FROM sprints WHERE id = ?", [sprintId], (err, result) => {
                if (err) {
                    console.error(`Error deleting sprint ${sprintId}:`, err);
                    return sendResponse(500, { error: "Failed to delete sprint" });
                }
                if (result.affectedRows === 0) {
                    return sendResponse(404, { error: "Sprint not found" });
                }
                res.writeHead(204);
                res.end();
            });
        }

        // TOGGLE ACTIVE SPRINT: /api/sprints/:id/active (PUT)
        else if (
            pathSegments.length === 4 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_SPRINTS &&
            pathSegments[3] === "active" &&
            req.method === "PUT"
        ) {
            const sprintId = pathSegments[2];

            try {
                const { shouldActivate } = JSON.parse(buffer);
                const activeStatus = shouldActivate ? 1 : 0;

                const updateActiveStatus = (callback) => {
                    const updateQuery = "UPDATE sprints SET is_active = ? WHERE id = ?";
                    connection.query(updateQuery, [activeStatus, sprintId], (err, result) => {
                        if (err) {
                            console.error(`Error updating sprint ${sprintId} status:`, err);
                            return callback(new Error("Failed to update sprint status"));
                        }
                        if (result.affectedRows === 0) {
                            return callback(new Error("Sprint not found"));
                        }
                        callback(null);
                    });
                };

                if (shouldActivate) {
                    connection.query("UPDATE sprints SET is_active = 0 WHERE id != ?", [sprintId], (err) => {
                        if (err) {
                            console.error("Error deactivating other sprints:", err);
                        }
                        updateActiveStatus((error) => {
                            if (error) return sendResponse(error.message.includes("not found") ? 404 : 500, { error: error.message });
                            sendResponse(200, { message: "Sprint set as active successfully", is_active: true });
                        });
                    });
                } else {
                    updateActiveStatus((error) => {
                        if (error) return sendResponse(error.message.includes("not found") ? 404 : 500, { error: error.message });
                        sendResponse(200, { message: "Sprint set as inactive successfully", is_active: false });
                    });
                }

            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input for sprint status update" });
            }
        }

        // ------------------------------------
        // --- 7. LESSONS & CATEGORY ROUTES (UPDATED) ---
        // ------------------------------------

        // NEW: GET ALL CATEGORIES: /api/categories (GET)
        else if (pathUrl === `${API_BASE}/${RESOURCE_CATEGORIES}` && req.method === "GET") {
            const query = "SELECT id, name FROM skill_categories ORDER BY name ASC";
            connection.query(query, (err, results) => {
                if (err) {
                    console.error("Error fetching categories:", err);
                    return sendResponse(500, { error: "Failed to fetch categories. (Check DB schema: 'skill_categories' table)." });
                }
                sendResponse(200, results);
            });
        }
        
        // NEW: CREATE NEW CATEGORY: /api/categories (POST)
        else if (pathUrl === `${API_BASE}/${RESOURCE_CATEGORIES}` && req.method === "POST") {
            try {
                const { name } = JSON.parse(buffer);

                if (!name) {
                    return sendResponse(400, { error: "Category name is required." });
                }

                const insertQuery = "INSERT INTO skill_categories (name) VALUES (?)";
                connection.query(
                    insertQuery,
                    [name],
                    (err, result) => {
                        if (err) {
                            if (err.code === 'ER_DUP_ENTRY') {
                                return sendResponse(409, { error: "Category already exists." });
                            }
                            console.error("Error creating new category:", err);
                            return sendResponse(500, { error: "Failed to create new category." });
                        }
                        sendResponse(201, {
                            message: "Category created successfully",
                            id: result.insertId,
                            name
                        });
                    }
                );
            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input for category creation." });
            }
        }
        
        // NEW: DELETE CATEGORY: /api/categories/:id (DELETE)
        else if (
            pathSegments.length === 3 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_CATEGORIES &&
            req.method === "DELETE"
        ) {
            const categoryId = pathSegments[2];
            connection.query("DELETE FROM skill_categories WHERE id = ?", [categoryId], (err, result) => {
                if (err) {
                    console.error(`Error deleting category ${categoryId}:`, err);
                    return sendResponse(500, { error: "Failed to delete category (Ensure no lessons are using it)." });
                }
                if (result.affectedRows === 0) {
                    return sendResponse(404, { error: "Category not found" });
                }
                res.writeHead(204);
                res.end();
            });
        }
        
      // server.js - ADD THIS MISSING ROUTE

// GET ALL LESSONS: /api/lessons (GET)
else if (pathUrl === `${API_BASE}/${RESOURCE_LESSONS}` && req.method === "GET") {
    const query = `
        SELECT 
            l.id, 
            l.title, 
            l.code_snippet, 
            l.description, 
            l.challenge, 
            l.reflection, 
            c.name AS skill_category,
            l.level, 
            l.created_at 
        FROM lessons l
        LEFT JOIN skill_categories c ON l.skill_category_id = c.id
        ORDER BY l.created_at DESC
    `.trim();

    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching lessons:", err);
            return sendResponse(500, { error: "Failed to fetch lessons." });
        }
        sendResponse(200, results);
    });
}

        // GET LESSON BY ID: /api/lessons/:id (GET)
        else if (
            pathSegments.length === 3 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_LESSONS &&
            req.method === "GET"
        ) {
            const lessonId = pathSegments[2];
            const query = `
                SELECT 
                    l.id, 
                    l.title, 
                    l.code_snippet, 
                    l.description, 
                    l.challenge, 
                    l.reflection, 
                    c.name AS skill_category,
                    l.level, 
                    l.created_at 
                FROM lessons l
                LEFT JOIN skill_categories c ON l.skill_category_id = c.id
                WHERE l.id = ?`.trim();

            connection.query(
                query,
                [lessonId],
                (err, results) => {
                    if (err) {
                        console.error(`Error fetching lesson ${lessonId}:`, err);
                        return sendResponse(500, { error: "Failed to fetch lesson." });
                    }
                    if (results.length === 0) return sendResponse(404, { error: "Lesson not found" });
                    sendResponse(200, results[0]);
                }
            );
        }

        // CREATE NEW LESSON: /api/lessons (POST) 
        else if (pathUrl === `${API_BASE}/${RESOURCE_LESSONS}` && req.method === "POST") {
            try {
                const payload = JSON.parse(buffer);
                const {
                    title,
                    code_snippet = null,
                    description = null,
                    challenge = null,
                    reflection = null,
                    skill_category_id = null,
                    level = "beginner"
                } = payload;

                if (!title || !description) {
                    return sendResponse(400, { error: "Title and description are required for a lesson." });
                }

                const insertQuery = `
                    INSERT INTO lessons 
                        (title, code_snippet, description, challenge, reflection, skill_category_id, level, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `.trim();

                connection.query(
                    insertQuery,
                    [title, code_snippet, description, challenge, reflection, skill_category_id, level],
                    (err, result) => {
                        if (err) {
                            console.error("Error inserting lesson:", err);
                            return sendResponse(500, { error: "Failed to create lesson." });
                        }
                        sendResponse(201, {
                            message: "Lesson created successfully",
                            id: result.insertId,
                            title,
                            code_snippet,
                            description,
                            challenge,
                            reflection,
                            skill_category_id,
                            level
                        });
                    }
                );
            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input for lesson creation." });
            }
        }

        // UPDATE LESSON: /api/lessons/:id (PUT)
        else if (
            pathSegments.length === 3 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_LESSONS &&
            req.method === "PUT"
        ) {
            const lessonId = pathSegments[2];
            try {
                const payload = JSON.parse(buffer);
                const fields = [];
                const values = [];

                const allowedFields = ["title", "code_snippet", "description", "challenge", "reflection", "skill_category_id", "level"];
                
                allowedFields.forEach((f) => {
                    if (payload[f] !== undefined) {
                        fields.push(`${f} = ?`);
                        values.push(payload[f]);
                    }
                });
                
                // NOTE: The 'skill_category' column is deprecated in favor of 'skill_category_id'
                // But included here for backwards compatibility if the client still sends it.
                if (payload.skill_category !== undefined) {
                    fields.push(`skill_category = ?`); 
                    values.push(payload.skill_category);
                }

                if (fields.length === 0) return sendResponse(400, { error: "No fields provided to update." });

                values.push(lessonId); 
                const updateQuery = `UPDATE lessons SET ${fields.join(", ")} WHERE id = ?`.trim();
                connection.query(updateQuery, values, (err, result) => {
                    if (err) {
                        console.error(`Error updating lesson ${lessonId}:`, err);
                        return sendResponse(500, { error: "Failed to update lesson." });
                    }
                    if (result.affectedRows === 0) return sendResponse(404, { error: "Lesson not found." });
                    sendResponse(200, { message: "Lesson updated successfully", id: lessonId });
                });
            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input for lesson update." });
            }
        }

        // DELETE LESSON: /api/lessons/:id (DELETE)
        else if (
            pathSegments.length === 3 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_LESSONS &&
            req.method === "DELETE"
        ) {
            const lessonId = pathSegments[2];
            connection.query("DELETE FROM lessons WHERE id = ?", [lessonId], (err, result) => {
                if (err) {
                    console.error(`Error deleting lesson ${lessonId}:`, err);
                    return sendResponse(500, { error: "Failed to delete lesson" });
                }
                if (result.affectedRows === 0) {
                    return sendResponse(404, { error: "Lesson not found" });
                }
                res.writeHead(204);
                res.end();
            });
        }

        // ------------------------------------
        // --- 8. USER MANAGEMENT ROUTES ---
        // ------------------------------------

        // NEW ROUTE: GET USER STATS: /api/users/:id/stats (GET)
        else if (
            pathSegments.length === 4 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_USERS &&
            pathSegments[3] === "stats" &&
            req.method === "GET"
        ) {
            const requestedUserId = parseInt(pathSegments[2], 10);
            if (!authenticate() || requestedUserId !== userId) {
                // Ensure user can only fetch their own stats
                return sendResponse(403, { error: "Forbidden. You can only view your own stats." });
            }

            // NOTE: This query relies on the 'learning_time_spent' table existing
            const statsQuery = `
                SELECT
                    (SELECT COUNT(id) FROM sprints) AS totalSprints,
                    COUNT(DISTINCT sp.sprint_id) AS completedSprints,
                    COALESCE(SUM(lts.time_spent_minutes), 0) AS totalMinutes,
                    u.streak_days AS streakDays,
                    COALESCE(SUM(CASE WHEN lts.last_updated >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN lts.time_spent_minutes ELSE 0 END), 0) AS weeklyMinutes
                FROM users u
                LEFT JOIN sprint_progress sp ON u.id = sp.user_id AND sp.is_completed = 1
                LEFT JOIN learning_time_spent lts ON u.id = lts.user_id
                WHERE u.id = ?
                GROUP BY u.id, u.streak_days; -- Group by streak_days explicitly since it's not aggregated
            `.trim();
            
            connection.query(statsQuery, [requestedUserId], (err, results) => {
                if (err) {
                    console.error(`Error fetching user stats for user ${requestedUserId}:`, err);
                    // Fallback to mock data if DB access fails (matching client-side fallback structure)
                    // The client handles the 500 error gracefully by using mock data if the API fails.
                    return sendResponse(500, { 
                        error: "Failed to fetch user stats from DB",
                        totalSprints: 12, completedSprints: 6, totalMinutes: 342, streakDays: 7, weeklyProgress: 75, learningHours: 28 
                    });
                }
                
                if (results.length === 0) return sendResponse(404, { error: "User not found." });

                const stats = results[0];
                const totalMinutes = stats.totalMinutes || 0;
                const weeklyMinutes = stats.weeklyMinutes || 0;
                const learningHours = Math.round((totalMinutes / 60) * 10) / 10 || 0;
                // Mock weekly target of 5 hours (300 mins)
                const weeklyProgress = Math.min(100, Math.round((weeklyMinutes / 300) * 100)) || 0; 

                sendResponse(200, {
                    totalSprints: stats.totalSprints || 0,
                    completedSprints: stats.completedSprints || 0,
                    totalMinutes: totalMinutes,
                    streakDays: stats.streakDays || 0,
                    weeklyProgress: weeklyProgress, 
                    learningHours: learningHours, 
                });
            });
        }

        // GET ALL USERS: /api/users (GET)
        else if (pathUrl === `${API_BASE}/${RESOURCE_USERS}` && req.method === "GET") {
            // IMPORTANT: Ensure the 'role' column is selected
            const query = `
                SELECT 
                    id, 
                    name, 
                    email, 
                    streak_days, 
                    created_at,
                    COALESCE(role, CASE WHEN id = 1 THEN 'admin' ELSE 'user' END) as role
                FROM users;
            `.trim();
            connection.query(query, (err, results) => {
                if (err) {
                    if (err.code === 'ER_BAD_FIELD_ERROR') {
                        console.warn("Error fetching users (Role column likely missing). Attempting fallback.");
                        const fallbackQuery = `
                            SELECT 
                                id, 
                                name, 
                                email, 
                                streak_days, 
                                created_at,
                                CASE WHEN id = 1 THEN 'admin' ELSE 'user' END as role
                            FROM users;
                        `.trim();
                        connection.query(fallbackQuery, (fallbackErr, fallbackResults) => {
                            if (fallbackErr) return sendResponse(500, { error: "Failed to fetch user data (Fallback error)." });
                            sendResponse(200, fallbackResults);
                        });
                        return;
                    }
                    console.error("Error fetching users:", err);
                    return sendResponse(500, { error: "Failed to fetch user data" });
                }
                sendResponse(200, results);
            });
        }

        // DELETE USER: /api/users/:id (DELETE)
        else if (
            pathSegments.length === 3 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_USERS &&
            req.method === "DELETE"
        ) {
            const userIdToDelete = pathSegments[2];

            connection.query("DELETE FROM users WHERE id = ?", [userIdToDelete], (err, result) => {
                if (err) {
                    console.error(`Error deleting user ${userIdToDelete}:`, err);
                    return sendResponse(500, { error: "Failed to delete user" });
                }
                if (result.affectedRows === 0) {
                    return sendResponse(404, { error: "User not found" });
                }
                res.writeHead(204);
                res.end();
            });
        }

        // UPDATE USER ROLE: /api/users/:id/role (PUT)
        else if (
            pathSegments.length === 4 &&
            pathSegments[0] === API_BASE &&
            pathSegments[1] === RESOURCE_USERS &&
            pathSegments[3] === "role" &&
            req.method === "PUT"
        ) {
            const userIdToUpdate = pathSegments[2];

            try {
                const { newRole } = JSON.parse(buffer);

                if (!["admin", "user"].includes(newRole)) {
                    return sendResponse(400, { error: "Invalid role provided. Must be 'admin' or 'user'." });
                }

                const updateQuery = "UPDATE users SET role = ? WHERE id = ?";

                connection.query(updateQuery, [newRole, userIdToUpdate], (err, result) => {
                    if (err) {
                        console.error(`Error updating user ${userIdToUpdate} role:`, err);
                        if (err.code === 'ER_BAD_FIELD_ERROR') {
                            return sendResponse(500, { error: "Database configuration error: 'role' column likely missing in 'users' table." });
                        }
                        return sendResponse(500, { error: "Failed to update user role" });
                    }
                    if (result.affectedRows === 0) {
                        return sendResponse(404, { error: "User not found" });
                    }
                    sendResponse(200, { message: "Role updated successfully", newRole });
                });

            } catch (err) {
                sendResponse(400, { error: "Invalid JSON input for role update" });
            }
        }

        // ------------------------------------
        // --- 9. SPA FALLBACK & UNKNOWN ROUTE ---
        // ------------------------------------

        // Serve the front-end build directory for static assets
        else if (req.method === 'GET' && !pathSegments[0].startsWith(API_BASE)) {
            const requestedPath = pathSegments.join('/');
            const absoluteFilePath = path.join(FRONTEND_DIR, requestedPath);
            
            // Determine if the file requested is a specific file (e.g., /assets/style.css)
            fs.stat(absoluteFilePath, (err, stats) => {
                let filePathToServe = absoluteFilePath;
                let mimeType = 'text/html';

                if (err || !stats.isFile()) {
                    // If file not found, serve index.html (SPA Fallback)
                    filePathToServe = path.join(FRONTEND_DIR, 'index.html');
                    // We check if index.html exists, otherwise we return 404
                    if (!fs.existsSync(filePathToServe)) {
                         return sendResponse(404, { error: "Route not found (and index.html missing for SPA fallback)" });
                    }
                } else {
                     // If file found, set correct mime type for assets
                    const ext = path.extname(absoluteFilePath).toLowerCase();
                    if (ext === '.css') mimeType = 'text/css';
                    else if (['.js', '.mjs'].includes(ext)) mimeType = 'application/javascript';
                    else if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) mimeType = `image/${ext.substring(1)}`;
                    // Add other common asset types as needed
                }

                fs.readFile(filePathToServe, (readErr, content) => {
                    if (readErr) {
                        console.error(`Error serving file ${filePathToServe}:`, readErr);
                        return sendResponse(500, { error: "Server error reading file." });
                    }
                    res.writeHead(200, { "Content-Type": mimeType });
                    res.end(content);
                });
            });
        }
        
        // FINAL CATCH-ALL (for unhandled API requests or non-GET requests)
        else {
            sendResponse(404, { error: "Route not found" });
        }
    });
});

server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'tetris.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = null;

function initDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database');
            
            // Create scores table if it doesn't exist
            db.run(`
                CREATE TABLE IF NOT EXISTS scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    player_name TEXT UNIQUE NOT NULL,
                    total_score INTEGER DEFAULT 0,
                    wins INTEGER DEFAULT 0,
                    losses INTEGER DEFAULT 0,
                    games INTEGER DEFAULT 0,
                    last_updated INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating scores table:', err.message);
                    reject(err);
                    return;
                }
                
                // Create speed_game_scores table for speed game specific scores
                db.run(`
                    CREATE TABLE IF NOT EXISTS speed_game_scores (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        player_name TEXT NOT NULL,
                        score INTEGER NOT NULL,
                        game_duration INTEGER DEFAULT 0,
                        lines_cleared INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating speed_game_scores table:', err.message);
                        reject(err);
                        return;
                    }
                    // Create reverse_game_scores table
                    db.run(`
                        CREATE TABLE IF NOT EXISTS reverse_game_scores (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            player_name TEXT NOT NULL,
                            score INTEGER NOT NULL,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `, (err) => {
                        if (err) {
                            console.error('Error creating reverse_game_scores table:', err.message);
                            reject(err);
                            return;
                        }
                        // Create newbrick_game_scores table
                        db.run(`
                            CREATE TABLE IF NOT EXISTS newbrick_game_scores (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                player_name TEXT NOT NULL,
                                score INTEGER NOT NULL,
                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                            )
                        `, (err) => {
                            if (err) {
                                console.error('Error creating newbrick_game_scores table:', err.message);
                                reject(err);
                                return;
                            }
                            // Seed demo data for reverse/newbrick leaderboards if empty
                            db.get(`SELECT COUNT(*) as cnt FROM reverse_game_scores`, (err, row) => {
                                if (err) {
                                    console.error('Error counting reverse_game_scores:', err.message);
                                } else if ((row?.cnt || 0) === 0) {
                                    const seedReverse = db.prepare(`INSERT INTO reverse_game_scores (player_name, score) VALUES (?, ?)`);
                                    seedReverse.run('Rev_Alice', 1200);
                                    seedReverse.run('Rev_Bob', 950);
                                    seedReverse.run('Rev_Carol', 780);
                                    seedReverse.finalize();
                                }
                                // Force-reseed specific demo rows for New Bricks leaderboard
                                db.run(`DELETE FROM newbrick_game_scores WHERE player_name IN ('Brick_Alice','Brick_Bob','Brick_Carol')`, (delErr) => {
                                    if (delErr) {
                                        console.error('Error deleting old newbrick demo rows:', delErr.message);
                                    }
                                    const seedNew = db.prepare(`INSERT INTO newbrick_game_scores (player_name, score) VALUES (?, ?)`);
                                    seedNew.run('Brick_Alice', 900);
                                    seedNew.run('Brick_Bob', 300);
                                    seedNew.run('Brick_Carol', 60);
                                    seedNew.finalize(() => {
                                        console.log('Database initialized successfully');
                                        resolve();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

function updateScore(playerName, deltaScore, didWin) {
    return new Promise((resolve, reject) => {
        if (!playerName) {
            resolve();
            return;
        }

        // First, try to get existing record
        db.get(
            'SELECT * FROM scores WHERE player_name = ?',
            [playerName],
            (err, row) => {
                if (err) {
                    console.error('Error querying player:', err.message);
                    reject(err);
                    return;
                }

                if (row) {
                    // Update existing record
                    const newTotalScore = row.total_score + Number(deltaScore || 0);
                    const newWins = didWin ? row.wins + 1 : row.wins;
                    const newLosses = didWin ? row.losses : row.losses + 1;
                    const newGames = row.games + 1;

                    db.run(
                        `UPDATE scores SET 
                            total_score = ?, 
                            wins = ?, 
                            losses = ?, 
                            games = ?, 
                            last_updated = ?
                        WHERE player_name = ?`,
                        [newTotalScore, newWins, newLosses, newGames, Date.now(), playerName],
                        function(err) {
                            if (err) {
                                console.error('Error updating score:', err.message);
                                reject(err);
                                return;
                            }
                            console.log(`Updated score for ${playerName}: +${deltaScore} (${didWin ? 'win' : 'loss'})`);
                            resolve();
                        }
                    );
                } else {
                    // Insert new record
                    const totalScore = Number(deltaScore || 0);
                    const wins = didWin ? 1 : 0;
                    const losses = didWin ? 0 : 1;

                    db.run(
                        `INSERT INTO scores (player_name, total_score, wins, losses, games, last_updated)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [playerName, totalScore, wins, losses, 1, Date.now()],
                        function(err) {
                            if (err) {
                                console.error('Error inserting score:', err.message);
                                reject(err);
                                return;
                            }
                            console.log(`Created new score record for ${playerName}: ${totalScore} points`);
                            resolve();
                        }
                    );
                }
            }
        );
    });
}

function getTopScores(n = 20) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT player_name as name, total_score as totalScore 
             FROM scores 
             ORDER BY total_score DESC, player_name ASC 
             LIMIT ?`,
            [n],
            (err, rows) => {
                if (err) {
                    console.error('Error getting top scores:', err.message);
                    reject(err);
                    return;
                }
                resolve(rows || []);
            }
        );
    });
}

function getAllScores() {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT player_name, total_score, wins, losses, games, last_updated 
             FROM scores 
             ORDER BY total_score DESC, player_name ASC`,
            (err, rows) => {
                if (err) {
                    console.error('Error getting all scores:', err.message);
                    reject(err);
                    return;
                }
                resolve(rows || []);
            }
        );
    });
}

function addSpeedGameScore(playerName, score, gameDuration = 0, linesCleared = 0) {
    return new Promise((resolve, reject) => {
        if (!playerName || score === undefined) {
            resolve();
            return;
        }

        db.run(
            `INSERT INTO speed_game_scores (player_name, score, game_duration, lines_cleared)
             VALUES (?, ?, ?, ?)`,
            [playerName, score, gameDuration, linesCleared],
            function(err) {
                if (err) {
                    console.error('Error inserting speed game score:', err.message);
                    reject(err);
                    return;
                }
                console.log(`Added speed game score for ${playerName}: ${score} points`);
                resolve();
            }
        );
    });
}

function getTopSpeedGameScores(n = 3) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT player_name as username, MAX(score) as score 
             FROM speed_game_scores 
             GROUP BY player_name
             ORDER BY score DESC 
             LIMIT ?`,
            [n],
            (err, rows) => {
                if (err) {
                    console.error('Error getting top speed game scores:', err.message);
                    reject(err);
                    return;
                }
                resolve(rows || []);
            }
        );
    });
}

function addReverseGameScore(playerName, score) {
    return new Promise((resolve, reject) => {
        if (!playerName || score === undefined) { resolve(); return; }
        db.run(
            `INSERT INTO reverse_game_scores (player_name, score) VALUES (?, ?)`,
            [playerName, score],
            function(err) {
                if (err) {
                    console.error('Error inserting reverse game score:', err.message);
                    reject(err);
                    return;
                }
                console.log(`Added reverse game score for ${playerName}: ${score}`);
                resolve();
            }
        );
    });
}

function getTopReverseGameScores(n = 3) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT player_name as username, MAX(score) as score 
             FROM reverse_game_scores 
             GROUP BY player_name
             ORDER BY score DESC 
             LIMIT ?`,
            [n],
            (err, rows) => {
                if (err) {
                    console.error('Error getting top reverse game scores:', err.message);
                    reject(err);
                    return;
                }
                resolve(rows || []);
            }
        );
    });
}

function addNewbrickGameScore(playerName, score) {
    return new Promise((resolve, reject) => {
        if (!playerName || score === undefined) { resolve(); return; }
        db.run(
            `INSERT INTO newbrick_game_scores (player_name, score) VALUES (?, ?)`,
            [playerName, score],
            function(err) {
                if (err) {
                    console.error('Error inserting newbrick game score:', err.message);
                    reject(err);
                    return;
                }
                console.log(`Added newbrick game score for ${playerName}: ${score}`);
                resolve();
            }
        );
    });
}

function getTopNewbrickGameScores(n = 3) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT player_name as username, MAX(score) as score 
             FROM newbrick_game_scores 
             GROUP BY player_name
             ORDER BY score DESC 
             LIMIT ?`,
            [n],
            (err, rows) => {
                if (err) {
                    console.error('Error getting top newbrick game scores:', err.message);
                    reject(err);
                    return;
                }
                resolve(rows || []);
            }
        );
    });
}

function closeDatabase() {
    return new Promise((resolve) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
                resolve();
            });
        } else {
            resolve();
        }
    });
}

// Initialize database on module load
initDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
});

module.exports = {
    updateScore,
    getTopScores,
    getAllScores,
    addSpeedGameScore,
    getTopSpeedGameScores,
    addReverseGameScore,
    getTopReverseGameScores,
    addNewbrickGameScore,
    getTopNewbrickGameScores,
    closeDatabase,
    initDatabase
};

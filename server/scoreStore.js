const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'scoreboard.json');

function ensureStore() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify({}), 'utf-8');
}

function load() {
    ensureStore();
    try {
        const raw = fs.readFileSync(FILE_PATH, 'utf-8');
        return JSON.parse(raw || '{}');
    } catch {
        return {};
    }
}

function save(obj) {
    ensureStore();
    fs.writeFileSync(FILE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
}

function updateScore(playerName, deltaScore, didWin) {
    if (!playerName) return;
    const db = load();
    if (!db[playerName]) {
        db[playerName] = { name: playerName, totalScore: 0, wins: 0, losses: 0, games: 0, lastUpdated: 0 };
    }
    const rec = db[playerName];
    rec.totalScore += Number(deltaScore || 0);
    rec.games += 1;
    if (didWin) rec.wins += 1; else rec.losses += 1;
    rec.lastUpdated = Date.now();
    save(db);
}

function top(n = 20) {
    const db = load();
    const arr = Object.values(db);
    arr.sort((a, b) => (b.totalScore - a.totalScore) || (a.name.localeCompare(b.name)));
    return arr.slice(0, n).map(({ name, totalScore }) => ({ name, totalScore }));
}

module.exports = { updateScore, top };



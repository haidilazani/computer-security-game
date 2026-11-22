"""
CyberQuest — CSC662 Computer Security Learning Game
Flask backend: authentication, profiles, activity history, game progress.
"""
import os
import re
import sqlite3
from datetime import datetime
from functools import wraps

from flask import (Flask, g, jsonify, redirect, render_template, request,
                   session, url_for)
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "cyberquest.db")

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("CYBERQUEST_SECRET", os.urandom(24).hex())

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,20}$")

GAMES = {
    "cia": {
        "title": "CIA Command Center",
        "chapter": "Chapter 1",
        "tagline": "Fundamentals of Computer Security",
        "icon": "shield",
        "levels": 4,
        "accent": "#22d3ee",
    },
    "access": {
        "title": "Gatekeeper Protocol",
        "chapter": "Chapter 2",
        "tagline": "Authentication & Access Control",
        "icon": "key",
        "levels": 4,
        "accent": "#a78bfa",
    },
    "crypto": {
        "title": "Crypto Lab",
        "chapter": "Chapter 3",
        "tagline": "Cryptography",
        "icon": "lock",
        "levels": 4,
        "accent": "#34d399",
    },
    "os": {
        "title": "Permission Terminal",
        "chapter": "Chapter 4",
        "tagline": "Operating System Security",
        "icon": "terminal",
        "levels": 4,
        "accent": "#fbbf24",
    },
    "malware": {
        "title": "Malware Hunter",
        "chapter": "Chapter 5",
        "tagline": "Software Security",
        "icon": "bug",
        "levels": 4,
        "accent": "#f87171",
    },
}

RANKS = [
    (0, "Script Kiddie"),
    (400, "Security Rookie"),
    (1200, "SOC Analyst"),
    (2400, "Penetration Tester"),
    (4000, "White Hat"),
    (6000, "Cyber Sentinel"),
]


# ---------------------------------------------------------------- database
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            email         TEXT UNIQUE NOT NULL COLLATE NOCASE,
            username      TEXT UNIQUE NOT NULL COLLATE NOCASE,
            name          TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at    TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS activity (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            action    TEXT NOT NULL,
            detail    TEXT,
            timestamp TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS progress (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            game_id      TEXT NOT NULL,
            level        INTEGER NOT NULL,
            stars        INTEGER NOT NULL DEFAULT 0,
            score        INTEGER NOT NULL DEFAULT 0,
            completed_at TEXT NOT NULL,
            UNIQUE (user_id, game_id, level)
        );

        CREATE TABLE IF NOT EXISTS tutorial_seen (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            game_id TEXT NOT NULL,
            UNIQUE (user_id, game_id)
        );
        """
    )
    db.commit()
    db.close()


def log_activity(user_id, action, detail=""):
    db = get_db()
    db.execute(
        "INSERT INTO activity (user_id, action, detail, timestamp) VALUES (?,?,?,?)",
        (user_id, action, detail, datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
    )
    db.commit()


# ---------------------------------------------------------------- helpers
def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            if request.path.startswith("/api/"):
                return jsonify(error="Not authenticated"), 401
            return redirect(url_for("login"))
        return view(*args, **kwargs)

    return wrapped


def current_user():
    db = get_db()
    return db.execute(
        "SELECT * FROM users WHERE id = ?", (session["user_id"],)
    ).fetchone()


def user_stats(user_id):
    db = get_db()
    rows = db.execute(
        "SELECT game_id, level, stars, score FROM progress WHERE user_id = ?",
        (user_id,),
    ).fetchall()
    total_xp = sum(r["score"] for r in rows)
    total_stars = sum(r["stars"] for r in rows)
    levels_done = len(rows)
    per_game = {gid: {"levels": 0, "stars": 0, "score": 0} for gid in GAMES}
    for r in rows:
        if r["game_id"] in per_game:
            per_game[r["game_id"]]["levels"] += 1
            per_game[r["game_id"]]["stars"] += r["stars"]
            per_game[r["game_id"]]["score"] += r["score"]
    rank = RANKS[0][1]
    next_rank = None
    next_xp = None
    for threshold, title in RANKS:
        if total_xp >= threshold:
            rank = title
        elif next_rank is None:
            next_rank, next_xp = title, threshold
    return {
        "xp": total_xp,
        "stars": total_stars,
        "levels_done": levels_done,
        "per_game": per_game,
        "rank": rank,
        "next_rank": next_rank,
        "next_xp": next_xp,
    }


# ---------------------------------------------------------------- auth pages
@app.route("/")
def index():
    if "user_id" in session:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")

    email = request.form.get("email", "").strip().lower()
    username = request.form.get("username", "").strip()
    name = request.form.get("name", "").strip()
    password = request.form.get("password", "")
    confirm = request.form.get("confirm", "")

    error = None
    if not EMAIL_RE.match(email):
        error = "Please enter a valid email address."
    elif not USERNAME_RE.match(username):
        error = "Username must be 3-20 characters (letters, numbers, underscore)."
    elif not name:
        error = "Please enter your name."
    elif len(password) < 8:
        error = "Password must be at least 8 characters."
    elif password != confirm:
        error = "Passwords do not match."

    if error is None:
        db = get_db()
        try:
            cur = db.execute(
                "INSERT INTO users (email, username, name, password_hash, created_at)"
                " VALUES (?,?,?,?,?)",
                (
                    email,
                    username,
                    name,
                    generate_password_hash(password),
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
            )
            db.commit()
            session.clear()
            session["user_id"] = cur.lastrowid
            log_activity(cur.lastrowid, "signup", f"Account created ({email})")
            log_activity(cur.lastrowid, "login", "Signed in")
            return redirect(url_for("dashboard"))
        except sqlite3.IntegrityError as exc:
            msg = str(exc).lower()
            error = (
                "That email is already registered."
                if "email" in msg
                else "That username is already taken."
            )

    return render_template("register.html", error=error,
                           email=email, username=username, name=name)


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    identity = request.form.get("identity", "").strip()
    password = request.form.get("password", "")
    db = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE email = ? OR username = ?",
        (identity.lower(), identity),
    ).fetchone()

    if user is None or not check_password_hash(user["password_hash"], password):
        return render_template(
            "login.html", error="Invalid credentials. Access denied.", identity=identity
        )

    session.clear()
    session["user_id"] = user["id"]
    log_activity(user["id"], "login", "Signed in")
    return redirect(url_for("dashboard"))


@app.route("/logout")
@login_required
def logout():
    log_activity(session["user_id"], "logout", "Signed out")
    session.clear()
    return redirect(url_for("login"))


# ---------------------------------------------------------------- app pages
@app.route("/dashboard")
@login_required
def dashboard():
    user = current_user()
    stats = user_stats(user["id"])
    db = get_db()
    progress = db.execute(
        "SELECT game_id, level, stars, score FROM progress WHERE user_id = ?",
        (user["id"],),
    ).fetchall()
    prog_map = {}
    for row in progress:
        prog_map.setdefault(row["game_id"], {})[row["level"]] = {
            "stars": row["stars"],
            "score": row["score"],
        }
    return render_template(
        "dashboard.html", user=user, stats=stats, games=GAMES, prog=prog_map
    )


@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    user = current_user()
    stats = user_stats(user["id"])
    message = error = None

    if request.method == "POST":
        form = request.form.get("form")
        db = get_db()

        if form == "details":
            name = request.form.get("name", "").strip()
            username = request.form.get("username", "").strip()
            if not name:
                error = "Name cannot be empty."
            elif not USERNAME_RE.match(username):
                error = "Username must be 3-20 characters (letters, numbers, underscore)."
            else:
                try:
                    db.execute(
                        "UPDATE users SET name = ?, username = ? WHERE id = ?",
                        (name, username, user["id"]),
                    )
                    db.commit()
                    log_activity(user["id"], "profile", "Updated name/username")
                    message = "Profile updated."
                    user = current_user()
                except sqlite3.IntegrityError:
                    error = "That username is already taken."

        elif form == "password":
            current = request.form.get("current", "")
            new = request.form.get("new", "")
            confirm = request.form.get("confirm", "")
            if not check_password_hash(user["password_hash"], current):
                error = "Current password is incorrect."
            elif len(new) < 8:
                error = "New password must be at least 8 characters."
            elif new != confirm:
                error = "New passwords do not match."
            else:
                db.execute(
                    "UPDATE users SET password_hash = ? WHERE id = ?",
                    (generate_password_hash(new), user["id"]),
                )
                db.commit()
                log_activity(user["id"], "profile", "Changed password")
                message = "Password changed."

    return render_template(
        "profile.html", user=user, stats=stats, message=message, error=error
    )


@app.route("/history")
@login_required
def history():
    user = current_user()
    stats = user_stats(user["id"])
    db = get_db()
    rows = db.execute(
        "SELECT action, detail, timestamp FROM activity"
        " WHERE user_id = ? ORDER BY id DESC LIMIT 200",
        (user["id"],),
    ).fetchall()
    return render_template("history.html", user=user, stats=stats, entries=rows)


@app.route("/game/<game_id>")
@login_required
def game(game_id):
    if game_id not in GAMES:
        return redirect(url_for("dashboard"))
    user = current_user()
    stats = user_stats(user["id"])
    db = get_db()
    rows = db.execute(
        "SELECT level, stars, score FROM progress WHERE user_id = ? AND game_id = ?",
        (user["id"], game_id),
    ).fetchall()
    prog = {r["level"]: {"stars": r["stars"], "score": r["score"]} for r in rows}
    seen = db.execute(
        "SELECT 1 FROM tutorial_seen WHERE user_id = ? AND game_id = ?",
        (user["id"], game_id),
    ).fetchone()
    return render_template(
        "game.html",
        user=user,
        stats=stats,
        game_id=game_id,
        game=GAMES[game_id],
        prog=prog,
        tutorial_seen=bool(seen),
    )


# ---------------------------------------------------------------- APIs
@app.route("/api/progress", methods=["POST"])
@login_required
def api_progress():
    data = request.get_json(silent=True) or {}
    game_id = data.get("game_id")
    level = data.get("level")
    stars = data.get("stars")
    score = data.get("score")

    if (
        game_id not in GAMES
        or not isinstance(level, int)
        or not 1 <= level <= GAMES[game_id]["levels"]
        or not isinstance(stars, int)
        or not 0 <= stars <= 3
        or not isinstance(score, int)
        or not 0 <= score <= 1000
    ):
        return jsonify(error="Invalid payload"), 400

    db = get_db()
    existing = db.execute(
        "SELECT stars, score FROM progress WHERE user_id=? AND game_id=? AND level=?",
        (session["user_id"], game_id, level),
    ).fetchone()

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if existing is None:
        db.execute(
            "INSERT INTO progress (user_id, game_id, level, stars, score, completed_at)"
            " VALUES (?,?,?,?,?,?)",
            (session["user_id"], game_id, level, stars, score, now),
        )
    else:
        # keep the best result
        db.execute(
            "UPDATE progress SET stars=MAX(stars,?), score=MAX(score,?), completed_at=?"
            " WHERE user_id=? AND game_id=? AND level=?",
            (stars, score, now, session["user_id"], game_id, level),
        )
    db.commit()

    title = GAMES[game_id]["title"]
    log_activity(
        session["user_id"],
        "level",
        f"{title} — completed Level {level} ({stars}★, {score} pts)",
    )
    return jsonify(ok=True, stats=user_stats(session["user_id"]))


@app.route("/api/activity", methods=["POST"])
@login_required
def api_activity():
    data = request.get_json(silent=True) or {}
    action = data.get("action", "")
    detail = str(data.get("detail", ""))[:200]
    if action not in ("game_start", "level_start", "tutorial"):
        return jsonify(error="Invalid action"), 400
    log_activity(session["user_id"], action, detail)
    return jsonify(ok=True)


@app.route("/api/tutorial-seen", methods=["POST"])
@login_required
def api_tutorial_seen():
    data = request.get_json(silent=True) or {}
    game_id = data.get("game_id")
    if game_id not in GAMES:
        return jsonify(error="Invalid game"), 400
    db = get_db()
    db.execute(
        "INSERT OR IGNORE INTO tutorial_seen (user_id, game_id) VALUES (?,?)",
        (session["user_id"], game_id),
    )
    db.commit()
    return jsonify(ok=True)


init_db()

if __name__ == "__main__":
    print()
    print("  ============================================")
    print("   CyberQuest - CSC662 Computer Security Game")
    print("   Open  http://127.0.0.1:5000  in your browser")
    print("  ============================================")
    print()
    app.run(debug=False, host="127.0.0.1", port=5000)

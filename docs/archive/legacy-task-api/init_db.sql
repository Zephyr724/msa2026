CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'on_hold')),
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 1 CHECK(priority BETWEEN 1 AND 5),
    completed BOOLEAN DEFAULT 0,
    project_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

INSERT OR IGNORE INTO users (name, email) VALUES ('Alice', 'alice@example.com');
INSERT OR IGNORE INTO users (name, email) VALUES ('Bob', 'bob@example.com');
INSERT OR IGNORE INTO projects (name, status, user_id) VALUES ('MSA 2026', 'active', 1);
INSERT OR IGNORE INTO projects (name, status, user_id) VALUES ('Learn Rust', 'active', 2);
INSERT OR IGNORE INTO tasks (title, description, priority, project_id) VALUES ('Set up DB', 'Configure SQLite MCP', 5, 1);
INSERT OR IGNORE INTO tasks (title, description, priority, project_id) VALUES ('Write API', 'REST API for tasks', 3, 1);
INSERT OR IGNORE INTO tasks (title, description, priority, completed, project_id) VALUES ('Read Rust book', 'Chapter 1-3', 2, 1, 2);
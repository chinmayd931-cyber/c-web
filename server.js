const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const TRANSACTION_STORE = path.join(DATA_DIR, "transactions.json");

const ensureStore = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(TRANSACTION_STORE)) {
        fs.writeFileSync(TRANSACTION_STORE, JSON.stringify([]));
    }
};

const readTransactions = () => {
    ensureStore();
    try {
        return JSON.parse(fs.readFileSync(TRANSACTION_STORE, "utf8"));
    } catch (error) {
        console.error("Failed to read transactions:", error);
        return [];
    }
};

const writeTransactions = list => {
    ensureStore();
    fs.writeFileSync(TRANSACTION_STORE, JSON.stringify(list, null, 2));
};

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // frontend folder

/**
 * Resolve the compiled C binary name for the current platform.
 * We support tracker.exe, a.exe (gcc default on Windows) and ./tracker for POSIX.
 */
const resolveBinaryPath = () => {
    const candidateNames =
        process.platform === "win32"
            ? ["tracker.exe", "a.exe"]
            : ["tracker"];

    return candidateNames
        .map(name => path.join(__dirname, name))
        .find(fs.existsSync);
};

app.get("/api/transactions", (_req, res) => {
    res.json({ transactions: readTransactions() });
});

app.post("/api/transactions", (req, res) => {
    const { amount, category } = req.body || {};
    if (typeof amount !== "number" || Number.isNaN(amount)) {
        return res.status(400).json({ error: "Amount must be a number." });
    }
    if (!["1", "2", "3"].includes(String(category))) {
        return res.status(400).json({ error: "Category must be 1, 2, or 3." });
    }

    const transactions = readTransactions();
    const newEntry = {
        id: randomUUID(),
        amount,
        category: String(category),
        createdAt: new Date().toISOString()
    };

    transactions.push(newEntry);
    writeTransactions(transactions);
    res.status(201).json({ transaction: newEntry });
});

app.delete("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    const transactions = readTransactions();
    const next = transactions.filter(entry => entry.id !== id);

    if (next.length === transactions.length) {
        return res.status(404).json({ error: "Transaction not found." });
    }

    writeTransactions(next);
    res.json({ success: true });
});

app.delete("/api/transactions", (_req, res) => {
    writeTransactions([]);
    res.json({ success: true });
});

// API to run C program
app.post("/run-c", (req, res) => {
    const { script } = req.body || {};

    if (!script || typeof script !== "string" || !script.trim()) {
        return res
            .status(400)
            .json({ error: "Please provide the command script for tracker.c." });
    }

    const binaryPath = resolveBinaryPath();
    if (!binaryPath) {
        return res.status(500).json({
            error:
                "C executable not found. Compile tracker.c first (e.g. gcc tracker.c -o tracker.exe)."
        });
    }

    const cProgram = spawn(binaryPath, [], { stdio: ["pipe", "pipe", "pipe"] });

    let output = "";
    let errorOutput = "";

    cProgram.stdout.on("data", data => {
        output += data.toString();
    });

    cProgram.stderr.on("data", data => {
        errorOutput += data.toString();
    });

    cProgram.on("error", err => {
        console.error("Failed to start C program:", err);
        res.status(500).json({ error: "Unable to start C program." });
    });

    // Send script to C program
    const normalizedScript = script.endsWith("\n") ? script : `${script}\n`;
    cProgram.stdin.write(normalizedScript);
    cProgram.stdin.end();

    // When C program finishes
    cProgram.on("close", code => {
        console.log("C PROGRAM OUTPUT:\n" + output);

        if (code !== 0) {
            return res.status(500).json({
                error: "C program exited with an error.",
                details: errorOutput.trim()
            });
        }

        res.json({ output: output.trim() || "No output." });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

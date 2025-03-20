const knex = require("knex");
require('dotenv').config();

const connections = {}; // Aktif bağlantıları tutar
const timeouts = {}; // Zamanlayıcıları tutar

async function getDbConnection(dbName) {
    if (connections[dbName]) {
        // Eğer bağlantı zaten varsa, zamanlayıcıyı sıfırla
        resetTimeout(dbName);
        return connections[dbName];
    }

    try {
        const db = knex({
            client: "mysql",
            connection: {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: dbName,
                charset: "utf8mb4",
            },
            pool: { min: 2, max: 20 },
        });
        await db.raw("SELECT 1");
        connections[dbName] = db;
        console.log(`Connected to ${dbName}`);
        resetTimeout(dbName);
        return db;
    } catch (error) {
        console.error(`Database connection error: ${error.message}`);
        throw new Error("Database connection failed.");
    }
}

async function closeDbConnection(dbName) {
    if (connections[dbName]) {
        await connections[dbName].destroy();
        delete connections[dbName];
        delete timeouts[dbName];
        console.log(`Disconnected from ${dbName}`);
    }
}

function resetTimeout(dbName) {
    if (timeouts[dbName]) {
        clearTimeout(timeouts[dbName]);
    }

    timeouts[dbName] = setTimeout(() => {
        closeDbConnection(dbName);
    }, 15 * 60 * 1000);
}

module.exports = { getDbConnection, closeDbConnection };
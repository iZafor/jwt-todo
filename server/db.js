const mysql = require("mysql2/promise");
// make changes according to your setup
const db = mysql.createPool({
    host: "127.0.0.1",
    port: 3307,
    user: "root",
    password: "",
    database: "todo"
});

module.exports = db;
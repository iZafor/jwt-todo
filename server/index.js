require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcr = require("bcrypt");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const db = require("./db");

const taskRoute = require("./routes/task");

const app = express();
const PORT = 3000;
const expiresInOffset = 598000; // in millisecond
const allowedRoutes = ["/login", "/register", "/refresh"];

app.use(cors({ origin: "*" })); // * -> allows all sources, you can set to a specific origin like 127.0.0.1
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// example of a custom middleware (this middleware logs the request time, method, and url to the terminal)
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleString()} - ${req.method} - ${req.url}`);
    next();
});

// verifying JWT (Json Web Token)
app.use((req, res, next) => {
    if (req.method === "POST" && allowedRoutes.includes(req.url)) {
        return next();
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(401).send({ message: "unauthorized user!" });
    }

    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
        return res.status(401).send({ message: "unauthorized user!" });
    }

    jwt.verify(accessToken, process.env.ACCESS_JWT_SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(401).send({ message: "invalid access token!" });
        }
        req.user = user;
        next();
    });
});

app.use("/task", taskRoute);

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send({ message: "invalid data!" });
    }
    try {
        const user = await db
            .query("SELECT * FROM User_T WHERE email = ?", [email])
            .then((res) => res[0][0]);
        if (user) {
            const match = await bcr.compare(password, user["password"]);
            if (!match) {
                return res
                    .status(401)
                    .send({ message: "invalid credentials!" });
            }
            const refreshToken = generateRefreshJWT(user["user_id"]);
            const { accessToken, expiresIn } = generateAccessJWT(
                user["user_id"]
            );
            await db.query("INSERT INTO Jwt_T VALUES (?)", [refreshToken]);
            res.status(201).send({ accessToken, refreshToken, expiresIn });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "failed to login user!" });
    }
});

app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send({ message: "invalid data!" });
    }
    try {
        const userId = uuid.v4();
        const hashedPassword = await bcr.hash(password, 10);
        await db.query("INSERT INTO User_T VALUES (?, ?, ?)", [
            userId,
            email,
            hashedPassword,
        ]);
        const refreshToken = generateRefreshJWT(userId);
        const { accessToken, expiresIn } = generateAccessJWT(userId);
        await db.query("INSERT INTO Jwt_T VALUES (?)", [refreshToken]);
        res.status(201).send({ accessToken, refreshToken, expiresIn });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "failed to register user!" });
    }
});

app.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).send({ message: "invalid token!" });
    }
    try {
        const qRes = await db
            .query("SELECT * FROM Jwt_T WHERE token = ?", [refreshToken])
            .then((res) => res[0]);
        if (!qRes.length) {
            return res.status(401).send({ message: "invalid refresh token!" });
        }
        jwt.verify(
            qRes[0]["token"],
            process.env.REFRESH_JWT_SECRET_KEY,
            (err, user) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "invalid refresh token!" });
                }
                res.status(201).send(generateAccessJWT(user.userId));
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "failed to refresh token!" });
    }
});

app.delete("/logout", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).send({ message: "invalid token!" });
    }
    req.user = null;
    try {
        await db.query("DELETE FROM Jwt_T WHERE token = ?", [refreshToken]);
        res.status(200).send({ message: "logout successful!" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "failed to logout!" });
    }
});

const generateAccessJWT = (userId) => {
    return {
        accessToken: jwt.sign({ userId }, process.env.ACCESS_JWT_SECRET_KEY, {
            expiresIn: "10m",
        }),
        expiresIn: Date.now() + expiresInOffset,
    };
};

const generateRefreshJWT = (userId) => {
    return jwt.sign({ userId }, process.env.REFRESH_JWT_SECRET_KEY);
};

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

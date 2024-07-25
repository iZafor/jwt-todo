const express = require("express");
const uuid = require("uuid");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    const { userId } = req.user;
    try {
        res.send(
            await db
                .query(
                    "SELECT * FROM Task_T WHERE user_id = ? ORDER BY last_updated DESC",
                    [userId]
                )
                .then((res) => res[0])
        );
    } catch (error) {
        console.error(error);
        res.send([]);
    }
});

router.post("/", async (req, res) => {
    const { userId } = req.user;
    try {
        const { task } = req.body;
        const lastUpdated = new Date();
        const taskId = uuid.v4();
        await db.query("INSERT INTO Task_T VALUES (?, ?, ?, 'incomplete', ?)", [
            taskId,
            task,
            lastUpdated,
            userId,
        ]);
        res.status(201).send({
            message: "new task added successfully!",
            data: { taskId, lastUpdated },
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "failed to perform insert query!" });
    }
});

// patch is used when you want to apply partial modification

// :parameterName -> here parameterName is called route parameter.
// it can be used to create dynamic routes. the route parameters
// can be accessed through the req.params object as shown below.
// for more details visit - https://expressjs.com/en/guide/routing.html
router.patch("/:taskId", async (req, res) => {
    try {
        const taskId = req.params["taskId"];
        const { newTask } = req.body;
        const lastUpdated = new Date();
        await db.query(
            "UPDATE Task_T SET task = ?, last_updated = ? WHERE task_id = ?",
            [newTask, lastUpdated, taskId]
        );
        res.status(200).send({
            message: "task updated successfully!",
            data: { lastUpdated },
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "failed to update task!" });
    }
});

router.patch("/:taskId/status", async (req, res) => {
    try {
        const taskId = req.params["taskId"];
        const { newStatus } = req.body;
        const lastUpdated = new Date();
        await db.query(
            "UPDATE Task_T SET status = ?, last_updated = ? WHERE task_id = ?",
            [newStatus, lastUpdated, taskId]
        );
        res.status(200).send({
            message: "task status updated successfully!",
            data: { lastUpdated },
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "failed to update task status!" });
    }
});

router.delete("/:taskId", async (req, res) => {
    try {
        const taskId = req.params["taskId"];
        await db.query("DELETE FROM Task_T WHERE task_id = ?", [taskId]);
        res.status(200).send({ message: "task deleted successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "failed to delete task!" });
    }
});

module.exports = router;

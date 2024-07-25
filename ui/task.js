const API_ROOT = "http://127.0.0.1:3000";
const TASK_API_ROOT = "http://127.0.0.1:3000/task";
const tasks = [];
let authData = {};

const tasksContainer = document.querySelector(".tasks");
const newTaskInput = document.getElementById("task");
const addNewTaskButton = document.getElementById("add-new-task");
const logoutButton = document.getElementById("logout-button");

const getAuthData = () => {
    const newAuthData = JSON.parse(localStorage.getItem("authData"));
    if (!newAuthData) {
        return window.location.replace("./index.html");
    }
    return newAuthData;
};

const validateAccessToken = async () => {
    if (Date.now() > authData.expiresIn) {
        const res = await fetch(`${API_ROOT}/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refreshToken: authData.refreshToken,
            }),
        });

        if (res.ok) {
            const newAuthData = await res.json();
            authData = {
                ...authData,
                ...newAuthData,
            };
            localStorage.setItem("authData", JSON.stringify(authData));
        } else {
            alert("Auth Invalid!");
        }
    }
};

const getAllTasks = async () => {
    await validateAccessToken();
    return await fetch(TASK_API_ROOT, {
        method: "GET",
        headers: {
            authorization: `Bearer ${authData.accessToken}`,
        },
    })
        .then((res) => res.json())
        .then((tasks) =>
            tasks.map((t) => ({
                ...t,
                last_updated: new Date(t["last_updated"]),
            }))
        );
};

const createTask = async (newTask) => {
    await validateAccessToken();
    const res = await fetch(TASK_API_ROOT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${authData.accessToken}`,
        },
        body: JSON.stringify({ task: newTask }),
    });
    if (res.ok) {
        const data = await res.json().then((res) => res["data"]);
        tasks.unshift({
            task_id: data["taskId"],
            task: newTask,
            lastUpdated: new Date(data["lastUpdated"]),
            status: "incomplete",
        });
        newTaskInput.value = "";
        renderTasks();
    }
};

const updateTask = async (taskId, newTask) => {
    await validateAccessToken();
    const res = await fetch(`${TASK_API_ROOT}/${taskId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${authData.accessToken}`,
        },
        body: JSON.stringify({ newTask }),
    });
    if (res.ok) {
        const idx = tasks.findIndex((task) => task["task_id"] === taskId);
        tasks[idx]["task"] = newTask;
        taskId[idx]["last_updated"] = await res
            .json()
            .then((res) => new Date(res["data"]["lastUpdated"]));
        renderTasks();
    }
};

const updateTaskStatus = async (taskId, newStatus) => {
    await validateAccessToken();
    const res = await fetch(`${TASK_API_ROOT}/${taskId}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${authData.accessToken}`,
        },
        body: JSON.stringify({ newStatus }),
    });
    if (res.ok) {
        const idx = tasks.findIndex((task) => task["task_id"] === taskId);
        tasks[idx]["status"] = newStatus;
        taskId[idx]["last_updated"] = await res
            .json()
            .then((res) => new Date(res["data"]["lastUpdated"]));
        renderTasks();
    }
};

const deleteTask = async (taskId) => {
    await validateAccessToken();
    const res = await fetch(`${TASK_API_ROOT}/${taskId}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${authData.accessToken}` },
    });
    if (res.ok) {
        tasks.splice(
            tasks.findIndex((task) => task["task_id"] === taskId),
            1
        );
        renderTasks();
    }
};

const logout = async () => {
    const res = await fetch(`${API_ROOT}/logout`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${authData.accessToken}`,
        },
        body: JSON.stringify({
            refreshToken: authData.refreshToken,
        }),
    });

    if (res.ok) {
        localStorage.removeItem("authData");
        window.location.replace("./index.html");
    } else {
        console.log(await res.json());
        alert("failed to logout!");
    }
};

const getTaskComponent = (task) => {
    const taskP = document.createElement("p");
    taskP.innerText = task["task"];

    const statusChkBox = document.createElement("input");
    statusChkBox.type = "checkbox";
    statusChkBox.addEventListener("change", () => {
        taskP.classList.toggle("completed-task");
        updateTaskStatus(
            task["task_id"],
            statusChkBox.checked ? "complete" : "incomplete"
        );
    });

    if (task["status"] === "complete") {
        taskP.classList.add("completed-task");
        statusChkBox.checked = true;
    }

    const editButton = document.createElement("img");
    editButton.src = "images/edit.png";
    editButton.addEventListener("click", () => {
        const newTaskInput = document.createElement("input");
        newTaskInput.classList.add("ghost-input");
        newTaskInput.value = task["task"];
        newTaskInput.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
                const newTask = !ev.target.value
                    ? task["task"]
                    : ev.target.value;
                updateTask(task["task_id"], newTask);
            }
        });
        newTaskInput.addEventListener("blur", (ev) => {
            const newTask = !ev.target.value ? task["task"] : ev.target.value;
            updateTask(task["task_id"], newTask);
        });

        taskP.parentNode.replaceChild(newTaskInput, taskP);
        newTaskInput.focus();
    });

    const deleteButton = document.createElement("img");
    deleteButton.src = "images/delete.png";
    deleteButton.addEventListener("click", () => {
        deleteTask(task["task_id"]);
    });

    const taskD = document.createElement("div");
    taskD.classList.add("task");
    taskD.appendChild(statusChkBox);
    taskD.appendChild(taskP);

    const taskActions = document.createElement("div");
    taskActions.classList.add("task-actions");
    taskActions.appendChild(editButton);
    taskActions.appendChild(deleteButton);

    const taskContainer = document.createElement("div");
    taskContainer.classList.add("task-container");
    taskContainer.appendChild(taskD);
    taskContainer.appendChild(taskActions);

    return taskContainer;
};

const renderTasks = () => {
    tasksContainer.innerHTML = "";
    tasks.forEach((task) => tasksContainer.appendChild(getTaskComponent(task)));
};

document.addEventListener("DOMContentLoaded", async () => {
    authData = getAuthData();

    tasks.push(...(await getAllTasks()));
    renderTasks();

    addNewTaskButton.addEventListener("click", () => {
        if (newTaskInput.value) {
            createTask(newTaskInput.value);
        }
    });

    newTaskInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            if (ev.target.value) {
                createTask(ev.target.value);
            }
        }
    });

    logoutButton.addEventListener("click", async () => {
        await logout();
    });
});

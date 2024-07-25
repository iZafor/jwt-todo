A simple todo app that uses [express.js](https://expressjs.com/) based backend and raw html, css, and js for the frontend. The main purpose of this app is to demonstrate the usage of [JWT](https://jwt.io/) for authentication along with some basic CRUD operations.

Setup procedure -

1. clone the repository
```bash
git clone https://github.com/iZafor/jwt-todo.git
```

2. create and populate [todo](server/todo.sql) database 
```sql
CREATE DATABASE todo;
USE todo;
SOURCE path-to-this-directory/server/todo.sql;

-- or, just use a gui tool like phpMyAdmin or Mysql Workbecnh
```

3. install dependencies
```bash
cd server
npm install
```

4. configure the database connection on [db.js](./server/db.js). here is the default config -
```js
{
    host: "127.0.0.1",
    port: 3307,
    user: "root",
    password: "",
    database: "todo"
}
```

5. start the express server
```bash
node index.js
```

6. run the frontend by starting a live server on [index.html](./ui/index.html) file. you can use extensions for your preferred ide or just use an npm package like [live-server](https://www.npmjs.com/package/live-server).
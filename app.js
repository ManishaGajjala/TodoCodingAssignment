const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Is running on http://localhost:3000");
    });
  } catch (error) {
    console.log(`Data base Error is ${error}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertCase = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

/*const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};*/

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = "";
  let getToDoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    //both status and priority
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getToDoQuery = `SELECT * FROM todo WHERE status='${status}' AND priority='${priority}';`;
          data = await db.all(getToDoQuery);
          response.send(data.map((eachItem) => convertCase(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //both category and priority is present
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getToDoQuery = `SELECT * FROM todo WHERE category='${category}' AND priority='${priority}';`;
          data = await db.all(getToDoQuery);
          response.send(data.map((eachItem) => convertCase(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //both category and status
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getToDoQuery = `SELECT * FROM todo WHERE category='${category}' AND status='${status}';`;
          data = await db.all(getToDoQuery);
          response.send(data.map((eachItem) => convertCase(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //only status
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getToDoQuery = `SELECT * FROM todo WHERE status='${status}';`;
        data = await db.all(getToDoQuery);
        response.send(data.map((eachItem) => convertCase(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //only priority
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getToDoQuery = `SELECT * FROM todo WHERE priority='${priority}';`;
        data = await db.all(getToDoQuery);
        response.send(data.map((eachItem) => convertCase(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      console.log("onlypriority");
      break;
    //only category
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getToDoQuery = `SELECT * FROM todo WHERE category='${category}';`;
        data = await db.all(getToDoQuery);
        response.send(data.map((eachItem) => convertCase(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getToDoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getToDoQuery);
      response.send(data.map((eachItem) => convertCase(eachItem)));
      //console.log("defaulet");
      break;
  }
});

//API2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const gettoDOById = `
        SELECT * FROM todo
        WHERE id=${todoId};`;
  const todo = await db.get(gettoDOById);
  response.send(convertCase(todo));
});

//API3
const isMatch = require("date-fns/isMatch");
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const requestQuery = `select * from todo where due_date='${newDate}';`;
    const responseResult = await db.all(requestQuery);
    //console.log(responseResult);
    response.send(responseResult.map((eachItem) => convertCase(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API4
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          console.log(newDueDate);
          const addToDoQuery = `
                    INSERT INTO todo
                    (id,todo,priority,status,category,due_date)
                    VALUES 
                    (${id},'${todo}','${priority}','${status}','${category}','${newDueDate}');`;
          await db.run(addToDoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  //console.log(todoId);
  const requestBody = request.body;
  const todoDetailtobeUpdatedQuery = `
    SELECT * FROM todo
    WHERE id=${todoId};`;
  const todoDetail = await db.get(todoDetailtobeUpdatedQuery);
  console.log(todoDetail);
  const {
    id = todoDetail.id,
    todo = todoDetail.todo,
    priority = todoDetail.priority,
    status = todoDetail.status,
    category = todoDetail.category,
    dueDate = todoDetail.due_date,
  } = requestBody;
  let updatedColumn = "";
  let updateDetailsQuery = "";
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updatedColumn = "Status";
        updateDetailsQuery = `
            UPDATE todo
            SET todo='${todo}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
                 WHERE id = ${todoId};`;
        await db.run(updateDetailsQuery);
        response.send(`${updatedColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updatedColumn = "Priority";
        updateDetailsQuery = `
            UPDATE todo
            SET todo='${todo}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
                 WHERE id = ${todoId};`;
        await db.run(updateDetailsQuery);
        response.send(`${updatedColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      updateDetailsQuery = `
            UPDATE todo
            SET todo='${todo}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
                 WHERE id = ${todoId};`;
      await db.run(updateDetailsQuery);
      response.send(`${updatedColumn} Updated`);
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updatedColumn = "Category";
        updateDetailsQuery = `
                UPDATE todo
                SET todo='${todo}',
                    priority='${priority}',
                    status='${status}',
                    category='${category}',
                    due_date='${dueDate}'
                     WHERE id = ${todoId};`;
        await db.run(updateDetailsQuery);
        response.send(`${updatedColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      console.log(isMatch(dueDate, "yyyy-MM-dd"));
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        console.log(newDueDate);
        updatedColumn = "Due Date";
        updateDetailsQuery = `
                UPDATE todo
                SET todo='${todo}',
                    priority='${priority}',
                    status='${status}',
                    category='${category}',
                    due_date='${newDueDate}'
                     WHERE id = ${todoId};`;
        await db.run(updateDetailsQuery);
        response.send(`${updatedColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    default:
      console.log("No Field updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteToDoQuery = `
        DELETE FROM todo
        WHERE id=${todoId};`;
  await db.run(deleteToDoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

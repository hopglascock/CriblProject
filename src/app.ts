import express, { json, urlencoded } from "express";
import logRouter from "./routes/logRouter";
import generateLogsRouter from "./routes/generateLogsRouter";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hello World",
      version: "1.0.0",
    },
  },
  apis: ["./src/routes/*.ts"],
};

var app = express();

app.get("/", (req, res) => {
  res.redirect("/docs");
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(options)));

// app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));

app.use("/logs", logRouter);
app.use("/generateLogs", generateLogsRouter);

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render("error");
// });

app.use(function (req, res) {
  res.sendStatus(404);
});

app.listen(4000, () => {
  console.log(`server running on port 4000`);
});

export default app;

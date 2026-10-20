const express = require("express");
const { PORT } = require("./src/config");
const orderRoutes = require("./src/routes/orderRoutes");
const { notFoundHandler, errorHandler } = require("./src/middlewares/errorHandler");

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.use(orderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Orders API is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
const {
  validateCreateOrder,
  createOrderRecord,
  persistOrderWithContext,
  getAllOrders,
  findOrderById,
  verifyOrderStateForRemoval,
  removeOrder,
  orderResponse,
  prepareOrderContext,
} = require("../services/orderService");
const { API_VERSION } = require("../config");

function validationProblem(message, details) {
  return {
    error: {
      code: "VALIDATION_ERROR",
      message,
      details,
    },
  };
}

function notFoundProblem() {
  return {
    error: {
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
    },
  };
}

const healthCheck = (req, res) => {
  res.status(200).json({
    status: "ok",
    version: API_VERSION,
  });
};

const createOrder = async (req, res, next) => {
  try {
    const validationErrors = validateCreateOrder(req.body);

    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json(validationProblem("Invalid order", validationErrors));
    }

    const newOrder = createOrderRecord(req.body);
    const storedOrder = await persistOrderWithContext(newOrder);
    const responseBody = orderResponse(storedOrder);

    return res
      .status(201)
      .location(`/orders/${storedOrder.id}`)
      .json(responseBody);
  } catch (error) {
    return next(error);
  }
};

const getOrders = (req, res) => {
  const orders = getAllOrders();
  const result = orders.map((order) => orderResponse(order));
  const responseBody = {
    orders: result,
    count: result.length,
  };

  res.status(200).json(responseBody);
};

const getOrderById = async (req, res, next) => {
  try {
    const requestedId = req.params.id;
    const matchingOrder = findOrderById(requestedId);

    if (!matchingOrder) {
      return res.status(404).json(notFoundProblem());
    }

    const context = await prepareOrderContext(matchingOrder);
    const responseBody = orderResponse(context.record);
    return res.status(200).json(responseBody);
  } catch (error) {
    return next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const existingOrder = findOrderById(orderId);

    if (!existingOrder) {
      return res.status(404).json(notFoundProblem());
    }

    await verifyOrderStateForRemoval(existingOrder);

    const success = removeOrder(orderId);
    if (!success) {
      return res.status(404).json(notFoundProblem());
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  healthCheck,
  createOrder,
  getOrders,
  getOrderById,
  deleteOrder,
};
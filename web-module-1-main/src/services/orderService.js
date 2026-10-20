const { randomUUID } = require("node:crypto");
const { DEFAULT_ORDER_STATUS } = require("../config");

const orders = [];

function makeOrderId() {
  return `ord-${randomUUID().slice(0, 8)}`;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateTotal(items) {
  return roundMoney(
    items.reduce((sum, item) => sum + item.quantity * item.price, 0),
  );
}

function copyItem(item) {
  return {
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  };
}

function orderResponse(order) {
  return {
    id: order.id,
    customerName: order.customerName,
    items: order.items.map(copyItem),
    total: order.total,
    status: order.status,
  };
}

function validateCreateOrder(body) {
  const problems = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    problems.push("Request body must be a JSON object");
    return problems;
  }

  if (
    typeof body.customerName !== "string" ||
    body.customerName.trim().length === 0
  ) {
    problems.push("customerName is required");
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    problems.push("At least one item is required");
    return problems;
  }

  body.items.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      problems.push(`items[${index}] must be an object`);
      return;
    }

    if (typeof item.name !== "string" || item.name.trim().length === 0) {
      problems.push(`items[${index}].name is required`);
    }

    if (
      typeof item.quantity !== "number" ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      problems.push(`items[${index}].quantity must be greater than zero`);
    }

    if (
      typeof item.price !== "number" ||
      !Number.isFinite(item.price) ||
      item.price <= 0
    ) {
      problems.push(`items[${index}].price must be greater than zero`);
    }
  });

  return problems;
}

function normalizeItems(items) {
  return items.map((item) => ({
    name: item.name.trim(),
    quantity: item.quantity,
    price: item.price,
  }));
}

// Прибираємо штучну затримку (synchronizeOrderState), 
// залишаючи лише контекст для збереження сумісності коду
function prepareOrderContext(order) {
  return {
    record: order,
    itemCount: order.items.length,
  };
}

function persistOrderWithContext(order) {
  orders.push(order);
  const context = prepareOrderContext(order);
  return context.record;
}

function verifyOrderStateForRemoval(order) {
  const context = prepareOrderContext(order);
  return context.itemCount === order.items.length;
}

function getAllOrders() {
  return orders;
}

function findOrderById(id) {
  return orders.find((order) => order.id === id);
}

function removeOrder(id) {
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return false;
  orders.splice(index, 1);
  return true;
}

function createOrderRecord(body) {
  const normalizedCustomerName = body.customerName.trim();
  const items = normalizeItems(body.items);
  const serverCalculatedTotal = calculateTotal(items);
  
  return {
    id: makeOrderId(),
    customerName: normalizedCustomerName,
    items,
    total: serverCalculatedTotal,
    status: DEFAULT_ORDER_STATUS,
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  validateCreateOrder,
  createOrderRecord,
  persistOrderWithContext,
  getAllOrders,
  findOrderById,
  verifyOrderStateForRemoval,
  removeOrder,
  orderResponse,
  prepareOrderContext,
};
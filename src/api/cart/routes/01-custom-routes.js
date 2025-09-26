module.exports = {
  routes: [
    {
      method: "GET",
      path: "/carts/me/current",
      handler: "cart.getCurrent",
    },
    {
      method: "POST",
      path: "/carts/add-item",
      handler: "cart.addItem",
    },
    {
      method: "POST",
      path: "/carts/remove-item",
      handler: "cart.removeItem",
    },
    {
      method: "POST",
      path: "/carts/update-item",
      handler: "cart.updateItem",
    },
  ],
};

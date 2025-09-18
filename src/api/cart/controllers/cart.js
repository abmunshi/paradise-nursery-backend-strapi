"use strict";

/**
 * cart controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::cart.cart", ({ strapi }) => ({
  // Get current active cart for authenticated user
  async getCurrent(ctx) {
    try {
      // Ensure user is authenticated or not
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized("You must be logged in to view the cart.");
      }
      console.log("before sanitization");
      // Call the service to get the cart
      const cart = await strapi
        .service("api::cart.cart")
        .getOrCreateCurrentCart(user.documentId);

      // Sanitize the output
      const sanitizedCart = await this.sanitizeOutput(cart, ctx);

      return this.transformResponse(sanitizedCart);
    } catch (error) {
      console.error("Error in getCurrent cart controller:", error);
      ctx.internalServerError("An error occurred while fetching the cart.");
    }
  },

  async addItem(ctx) {
    // Ensure user is authenticated or not
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("You must be logged in to modify the cart.");
    }

    const { productId, quantity } = ctx.request.body;

    if (!productId || !quantity || quantity <= 0) {
      return ctx.badRequest("Invalid product ID or quantity.");
    }
    try {
      // Call the service to get the current cart
      const cart = await strapi
        .service("api::cart.cart")
        .getOrCreateCurrentCart(user.documentId);

      // Call the service to add the item to the current cart
      const updatedCart = await strapi
        .service("api::cart.cart")
        .addItemToCart(cart.documentId, productId, quantity);

      // Sanitize the output
      const sanitizedCart = await this.sanitizeOutput(updatedCart);

      return this.transformResponse(sanitizedCart);
    } catch (error) {
      console.error("Error in addItem cart controller:", error);
      ctx.internalServerError(
        "An error occurred while adding item to the cart."
      );
    }
  },
  async removeItem(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("You must be logged in to modify the cart.");
    }

    const { cartItemId } = ctx.request.body;
    if (!cartItemId) {
      return ctx.badRequest("Cart item ID is required.");
    }

    try {
      // Get the user's active cart
      const cart = await strapi
        .service("api::cart.cart")
        .getOrCreateCurrentCart(user.documentId);

      // Remove the item from the cart
      const updatedCart = await strapi
        .service("api::cart.cart")
        .removeItemFromCart(cart.documentId, cartItemId);

      // Sanitize the output
      const sanitizedCart = await this.sanitizeOutput(updatedCart);

      return this.transformResponse(sanitizedCart);
    } catch (error) {
      console.error("Error in removeItem cart controller:", error);
      ctx.internalServerError(
        "An error occurred while removing item from the cart."
      );
    }
  },
}));

"use strict";

/**
 * cart controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::cart.cart", ({ strapi }) => ({
  // Get current active cart for authenticated user
  async getCurrent(ctx) {
    try {
      const user = ctx.state.user;

      // Call the service to get the cart
      const cart = await strapi
        .service("api::cart.cart")
        .getOrCreateCurrentCart(user.documentId);

      // Sanitize the output
      const sanitizedCart = await this.sanitizeOutput(cart, ctx);

      return this.transformResponse(sanitizedCart);
    } catch (err) {
      console.error("Error in getCurrent cart controller:", err);
      return ctx.internalServerError(
        "An error occurred wile fetching the cart.",
        {
          details: err.message,
        }
      );
    }
  },

  async addItem(ctx) {
    const user = ctx.state.user;

    const { productId, quantity } = ctx.request.body;

    if (!productId || !quantity || quantity <= 0) {
      return ctx.badRequest("Invalid product ID or quantity.");
    }
    console.log("Adding item to cart:", { productId, quantity });
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
      const sanitizedCart = await this.sanitizeOutput(updatedCart, ctx, {
        populate: {
          cart_items: {
            populate: {
              product: {
                populate: { image: true },
              },
            },
          },
        },
      });

      return this.transformResponse(sanitizedCart);
    } catch (err) {
      console.error("Error in addItem cart controller:", err);
      return ctx.internalServerError(
        "An error occurred while adding item to the cart.",
        { details: err.message }
      );
    }
  },

  async removeItem(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.request.body;

    if (!id) {
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
        .removeItemFromCart(cart.documentId, id);

      // Sanitize the output
      const sanitizedCart = await this.sanitizeOutput(updatedCart, ctx, {
        populate: {
          cart_items: {
            populate: {
              product: {
                populate: { image: true },
              },
            },
          },
        },
      });

      return this.transformResponse(sanitizedCart);
    } catch (err) {
      console.error("Error in removeItem cart controller:", err);
      return ctx.internalServerError(
        "An error occurred while removing item from the cart.",
        { details: err.message }
      );
    }
  },

  async updateItem(ctx) {
    const user = ctx.state.user;

    const { id, quantity } = ctx.request.body;

    if (!id || !quantity || quantity <= 0) {
      return ctx.badRequest("Invalid cart item ID or quantity.");
    }

    try {
      // Call the service to get the current cart
      const cart = await strapi
        .service("api::cart.cart")
        .getOrCreateCurrentCart(user.documentId);

      // Call the service to update the item in the current cart
      const updatedCart = await strapi
        .service("api::cart.cart")
        .updateItemInCart(cart, id, quantity);

      // Sanitize the output
      const sanitizedCart = await this.sanitizeOutput(updatedCart, ctx, {
        populate: {
          cart_items: {
            populate: {
              product: {
                populate: { image: true },
              },
            },
          },
        },
      });

      return this.transformResponse(sanitizedCart);
    } catch (err) {
      console.error("Error in updateItem cart controller:", err);
      return ctx.internalServerError(
        "An error occurred while updating the cart item.",
        { details: err.message }
      );
    }
  },
}));

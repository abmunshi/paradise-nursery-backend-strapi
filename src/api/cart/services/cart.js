"use strict";

/**
 * cart service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const { errors } = require("@strapi/utils");
const { NotFoundError, ValidationError, ApplicationError } = errors;

module.exports = createCoreService("api::cart.cart", ({ strapi }) => ({
  async getOrCreateCurrentCart(userId) {
    let cart = await strapi.documents("api::cart.cart").findFirst({
      filters: {
        user: { documentId: userId },
        cart_status: { $eq: "active" },
      },
      populate: {
        cart_items: {
          populate: {
            product: {
              populate: { image: true },
            },
          },
        },
      },
      status: "published",
    });
    if (!cart) {
      cart = await strapi.documents("api::cart.cart").create({
        data: {
          user: userId,
          cart_items: [],
          cart_status: "active",
          total: 0,
          currency: "USD",
        },
        meta: {},
      });

      // publish the cart
      await strapi.documents("api::cart.cart").publish({
        documentId: cart.documentId,
      });
      // Re-fetch to populate relations
      cart = await strapi.documents("api::cart.cart").findOne({
        documentId: cart.documentId,
        populate: { cart_items: true },
      });
    }
    return cart;
  },

  async addItemToCart(cartId, productId, quantity) {
    // Fetch the cart
    const cart = await strapi.documents("api::cart.cart").findOne({
      documentId: cartId,
      populate: { cart_items: { populate: { product: true } } },
    });
    if (!cart) {
      throw new NotFoundError("Cart not found");
    }

    // Validate quantity
    if (quantity <= 0) {
      throw new ValidationError("Quantity must be greater than zero");
    }
    // Fetch the product directly for validation
    const product = await strapi.documents("api::product.product").findOne({
      documentId: productId,
    });

    console.log("Product fetched:", product);
    if (!product) throw new NotFoundError("Product not found");

    console.log("cart items:", cart.cart_items);

    // Check stock (existing + new quantity)
    let existingItem = cart.cart_items.find(
      (item) => item.product.documentId === productId
    );

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;
    if (product.stock < newQuantity) {
      throw new ApplicationError("Not enough stock available.");
    }

    if (existingItem) {
      // If it exists, update the quantity
      console.log("existing Item", existingItem);

      await strapi.documents("api::cart-item.cart-item").update({
        documentId: existingItem.documentId,
        data: { quantity: newQuantity },
      });
      // Publish the updated cart item
      await strapi.documents("api::cart-item.cart-item").publish({
        documentId: existingItem.documentId,
      });
    } else {
      // If it doesn't exist, create a new cart item
      const newItem = await strapi
        .documents("api::cart-item.cart-item")
        .create({
          data: {
            product: productId,
            quantity,
            price: product.price,
            cart: cartId,
          },
        });
      // Publish the new cart item
      await strapi.documents("api::cart-item.cart-item").publish({
        documentId: newItem.documentId,
      });

      // Add the new item to the cart's cart_items array
      cart.cart_items.push(newItem);

      // Update the cart with the new item
      await strapi.documents("api::cart.cart").update({
        documentId: cart.documentId,
        data: { cart_items: cart.cart_items.map((item) => item.documentId) },
      });

      // Publish the updated cart
      await strapi.documents("api::cart.cart").publish({
        documentId: cart.documentId,
      });
    }

    const updatedCart = await strapi.documents("api::cart.cart").findOne({
      documentId: cart.documentId,
      populate: {
        cart_items: {
          fields: ["documentId", "quantity", "price", "variant"],
          populate: {
            product: {
              fields: ["documentId", "title", "summary", "price", "stock"],
              populate: {
                image: {
                  fields: ["formats"],
                },
              },
            },
          },
        },
      },
    });
    return updatedCart;
  },

  async removeItemFromCart(cartId, cartItemId) {
    // Fetch the cart
    const cart = await strapi.documents("api::cart.cart").findOne({
      documentId: cartId,
      populate: { cart_items: { populate: { product: true } } },
      published: true,
    });

    if (!cart) {
      throw new NotFoundError("Cart not found");
    }

    // Check if the item exists in the cart
    const itemExist = cart.cart_items.find(
      (item) => item.documentId === cartItemId
    );
    if (!itemExist) {
      throw new NotFoundError("Cart item not found in the cart");
    }

    // Remove the item from the cart's cart_items array
    cart.cart_items = cart.cart_items.filter(
      (item) => item.documentId !== cartItemId
    );
    await strapi.documents("api::cart.cart").update({
      documentId: cart.documentId,
      data: { cart_items: cart.cart_items.map((item) => item.documentId) },
    });

    // Publish the updated cart
    await strapi.documents("api::cart.cart").publish({
      documentId: cart.documentId,
    });

    // Optionally, you might want to delete the cart item document itself
    await strapi.documents("api::cart-item.cart-item").delete({
      documentId: cartItemId,
    });

    // Return the updated, populated cart
    const updatedCart = await strapi.documents("api::cart.cart").findOne({
      documentId: cart.documentId,
      populate: {
        cart_items: {
          fields: ["documentId", "quantity", "price", "variant"],
          populate: {
            product: {
              fields: ["documentId", "title", "summary", "price", "stock"],
              populate: {
                image: {
                  fields: ["formats"],
                },
              },
            },
          },
        },
      },
    });
    return updatedCart;
  },

  async updateItemInCart(cart, cartItemId, quantity) {
    // Check if the item exists in the cart
    const item = cart.cart_items.find((item) => item.documentId === cartItemId);
    if (!item) {
      throw new NotFoundError("Cart item not found in the cart");
    }

    // Update the quantity of the item
    await strapi.documents("api::cart-item.cart-item").update({
      documentId: item.documentId,
      data: { quantity },
    });

    // Publish the updated cart item
    await strapi.documents("api::cart-item.cart-item").publish({
      documentId: item.documentId,
    });

    // Return the updated, populated cart
    const updatedCart = await strapi.documents("api::cart.cart").findOne({
      documentId: cart.documentId,
      populate: {
        cart_items: {
          fields: ["documentId", "quantity", "price", "variant"],
          populate: {
            product: {
              fields: ["documentId", "title", "summary", "price", "stock"],
              populate: {
                image: {
                  fields: ["formats"],
                },
              },
            },
          },
        },
      },
    });
    return updatedCart;
  },
}));

//  sendProjectToShopify
//   redirectProjectToShopify
//   continueToShopifyAnyway

import {saveProjectBasketToStorage} from "../basket/basketStorage.js";
import {validateProjectBasketCompatibility} from "../compatibility/compatibility.js";
import {closeCompatibilityModal, openCompatibilityModal} from "../ui/compatibilityModal.js";

import {state} from "../state.js";
import {SHOPIFY_CART_URL} from "../constants.js";

export function sendProjectToShopify() {
  if (state.projectBasket.length === 0) return;

  const validation = validateProjectBasketCompatibility();

  if (!validation.ok) {
    openCompatibilityModal(validation.messages, validation.missingAdaptorKeys);
    return;
  }

  redirectProjectToShopify();
}

export function redirectProjectToShopify() {
  saveProjectBasketToStorage();

  const queryParams = state.projectBasket.map(item => `${item.id}:${item.qty}`).join(",");

  window.top.location.href = SHOPIFY_CART_URL + queryParams;
}

export function continueToShopifyAnyway() {
  closeCompatibilityModal();
  redirectProjectToShopify();
}

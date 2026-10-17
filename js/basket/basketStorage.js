//   saveProjectBasketToStorage
//   loadProjectBasketFromStorage
//   clearProjectBasketStorage
import {state} from "../state.js";
import {PROJECT_BASKET_STORAGE_KEY} from "../constants.js";


export function saveProjectBasketToStorage() {
  localStorage.setItem(PROJECT_BASKET_STORAGE_KEY, JSON.stringify(state.projectBasket));
}

export function readProjectBasketFromStorage() {
  const savedBasket = localStorage.getItem(PROJECT_BASKET_STORAGE_KEY);

  if (!savedBasket) {
    return [];
  }

  try {
    const parsedBasket = JSON.parse(savedBasket);

    return Array.isArray(parsedBasket) ? parsedBasket : [];
  } catch (error) {
    localStorage.removeItem(PROJECT_BASKET_STORAGE_KEY);
    return [];
  }
}

export function clearProjectBasketStorage() {
  localStorage.removeItem(PROJECT_BASKET_STORAGE_KEY);
}


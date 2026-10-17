//   addItemToProjectBasket
//   removeBasketItem
//   renderProjectBasketList
//   projectBasketHasAdaptor
//   projectBasketHasAllAdaptors
//   addMissingAdaptorFromModal


import {state} from "../state.js";

import {saveProjectBasketToStorage} from "./basketStorage.js";
import {ADAPTERS, DB_CABLES, DB_TIPS, UPSELLS} from "../catalogue/data.js";
import {updateCompatibilityModalAfterAdaptorChange} from "../ui/compatibilityModal.js";
import {ADAPTER_LABELS, UPSELL_LABELS} from "../constants.js";


export function renderProjectBasketList() {
  const listEl = document.getElementById("project-basket-list");
  const countEl = document.getElementById("basket-count");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (state.projectBasket.length === 0) {
    listEl.innerHTML = `<li class="basket-item" style="color:#888; justify-content:center; font-style:italic;">Your workspace is empty. Choose components above to start building.</li>`;
    countEl.innerText = "0 Items";
    checkoutBtn.disabled = true;
    saveProjectBasketToStorage();
    return;
  }

  countEl.innerText = `${state.projectBasket.length} Item${state.projectBasket.length > 1 ? 's' : ''}`;
  checkoutBtn.disabled = false;

  listEl.innerHTML = state.projectBasket.map((item, idx) => `
        <li class="basket-item">
            <span><strong>${item.qty}x</strong> ${item.nameHuman}</span>
            <button class="remove-btn" data-index="${idx}">✕</button>
        </li>
    `).join("");

  saveProjectBasketToStorage();
}

export function addItemToProjectBasket(itemType) {
  if (itemType === 'TIP') {
    const el = document.getElementById("tipDiameter");
    if (!el.value) return;
    const itemObj = DB_TIPS.find(t => t.id === el.value);
    const qty = parseInt(document.getElementById("tipQty").value);

    state.projectBasket.push({
      id: itemObj.id,
      type: "TIP",
      conn: itemObj.conn,
      nameHuman: `${itemObj.style} Tips (${itemObj.length}) - Size ${itemObj.size} (${itemObj.conn})`,
      qty: qty
    });
  } else if (itemType === 'CABLE') {
    const el = document.getElementById("cableLength");
    if (!el.value) return;
    const itemObj = DB_CABLES.find(c => c.id === el.value);
    const qty = parseInt(document.getElementById("cableQty").value);

    state.projectBasket.push({
      id: itemObj.id,
      type: "CABLE",
      conn: itemObj.conn,
      nameHuman: `${itemObj.type} Cable - Length ${itemObj.length} (${itemObj.conn})`,
      qty: qty
    });
  } else if (itemType === 'ADAPTER') {
    const qty = parseInt(document.getElementById("adaptorQty").value);
    const adaptorId = ADAPTERS[state.activeAdaptor];

    if (!adaptorId) return;

    state.projectBasket.push({
      id: adaptorId,
      type: "ADAPTER",
      adaptorKey: state.activeAdaptor,
      nameHuman: ADAPTER_LABELS[state.activeAdaptor],
      qty: qty
    });
  } else if (itemType === 'UPSELL') {
    const qty = parseInt(document.getElementById("upsellQty").value);
    const upsellId = UPSELLS[state.activeUpsell];

    if (!upsellId) return;

    state.projectBasket.push({
      id: upsellId,
      type: "UPSELL",
      upsellKey: state.activeUpsell,
      nameHuman: UPSELL_LABELS[state.activeUpsell],
      qty: qty
    });
  }

  renderProjectBasketList();
}

export function removeBasketItem(index) {
  state.projectBasket.splice(index, 1);
  renderProjectBasketList();
}


export function projectBasketHasAdaptor(adaptorKey) {
  return state.projectBasket.some(item => item.type === "ADAPTER" && item.adaptorKey === adaptorKey);
}


export function addMissingAdaptorFromModal(adaptorKey, buttonEl) {
  const adaptorId = ADAPTERS[adaptorKey];

  if (!adaptorId || projectBasketHasAdaptor(adaptorKey)) {
    return;
  }

  state.projectBasket.push({
    id: adaptorId,
    type: "ADAPTER",
    adaptorKey: adaptorKey,
    nameHuman: ADAPTER_LABELS[adaptorKey],
    qty: 1
  });

  renderProjectBasketList();

  if (buttonEl) {
    buttonEl.textContent = `✓ Added ${ADAPTER_LABELS[adaptorKey]}`;
    buttonEl.classList.add("added");
    buttonEl.disabled = true;
  }

  updateCompatibilityModalAfterAdaptorChange();
}

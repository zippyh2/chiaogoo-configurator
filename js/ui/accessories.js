//   openAccessoryModal
//   closeAccessoryModal
//   selectAccessoryModalOption
//   addSelectedAccessoryFromModal
//   getAccessoryModalOptionLabel

import {ADAPTER_LABELS, UPSELL_LABELS} from "../constants.js";
import {state} from "../state.js";
import {ADAPTERS, UPSELLS} from "../catalogue/data.js";
import {renderProjectBasketList} from "../basket/basket.js";

export function openAccessoryModal(accessoryType) {
  state.activeAccessoryModalType = accessoryType;
  state.activeAccessoryModalKey = accessoryType === "ADAPTER" ? state.activeAdaptor : state.activeUpsell;

  const overlay = document.getElementById("accessoryModalOverlay");
  const titleEl = document.getElementById("accessoryModalTitle");
  const introEl = document.getElementById("accessoryModalIntro");
  const optionsEl = document.getElementById("accessoryModalOptions");
  const qtyEl = document.getElementById("accessoryModalQty");

  qtyEl.value = "1";

  if (accessoryType === "ADAPTER") {
    titleEl.textContent = "🔌 Add adaptor";
    introEl.textContent = "Choose the adaptor size you need.";
    optionsEl.innerHTML = Object.keys(ADAPTERS).map(adaptorKey => `
                <button type="button"
                        class="accessory-modal-option ${adaptorKey === state.activeAccessoryModalKey ? 'selected' : ''}"
                        data-key="${adaptorKey}">
                    ${ADAPTER_LABELS[adaptorKey]}
                </button>
            `).join("");
  } else {
    titleEl.textContent = "🌀 Add cable swivels";
    introEl.textContent = "So your cables never get twisted again. Why not add?";
    optionsEl.innerHTML = Object.keys(UPSELLS).map(upsellKey => `
                <button type="button"
                        class="accessory-modal-option ${upsellKey === state.activeAccessoryModalKey ? 'selected' : ''}"
                        data-key="${upsellKey}">
                    ${UPSELL_LABELS[upsellKey]}
                </button>
            `).join("");
  }

  overlay.classList.add("visible");
}

export function selectAccessoryModalOption(optionKey) {
  state.activeAccessoryModalKey = optionKey;

  document.querySelectorAll("#accessoryModalOptions .accessory-modal-option").forEach(option => {
    option.classList.toggle("selected", option.innerText === getAccessoryModalOptionLabel(optionKey));
  });
}

export function closeAccessoryModal() {
  const overlay = document.getElementById("accessoryModalOverlay");

  overlay.classList.remove("visible");
}

export function addSelectedAccessoryFromModal() {
  const qty = parseInt(document.getElementById("accessoryModalQty").value);

  if (state.activeAccessoryModalType === "ADAPTER") {
    const adaptorId = ADAPTERS[state.activeAccessoryModalKey];

    if (!adaptorId) return;

    state.activeAdaptor = state.activeAccessoryModalKey;

    state.projectBasket.push({
      id: adaptorId,
      type: "ADAPTER",
      adaptorKey: state.activeAccessoryModalKey,
      nameHuman: ADAPTER_LABELS[state.activeAccessoryModalKey],
      qty: qty
    });
  } else if (state.activeAccessoryModalType === "UPSELL") {
    const upsellId = UPSELLS[state.activeAccessoryModalKey];

    if (!upsellId) return;

    state.activeUpsell = state.activeAccessoryModalKey;

    state.projectBasket.push({
      id: upsellId,
      type: "UPSELL",
      upsellKey: state.activeAccessoryModalKey,
      nameHuman: UPSELL_LABELS[state.activeAccessoryModalKey],
      qty: qty
    });
  }

  closeAccessoryModal();
  renderProjectBasketList();
}

function getAccessoryModalOptionLabel(optionKey) {
  if (state.activeAccessoryModalType === "ADAPTER") {
    return ADAPTER_LABELS[optionKey];
  }

  return UPSELL_LABELS[optionKey];
}



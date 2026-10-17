//   selectCableType
//   updateCableDropdown

import {state} from "../state.js";
import {DB_CABLES} from "../catalogue/data.js";
import {checkStock} from "../apiQuery.js";


export function selectCableType(type) {
  state.activeCableType = type;
  document.querySelectorAll("#carousel-cable-types .carousel-item").forEach(el => {
    // Clean, direct equality check
    el.classList.toggle("selected", el.dataset.type === type);
  });
  updateCableDropdown();
}

export async function updateCableDropdown() {
  const cableMenu = document.getElementById("cableLength");

  const availableCables = DB_CABLES.filter(c =>
    c.type === state.activeCableType
  );

  if (availableCables.length === 0) {
    cableMenu.innerHTML = `<option value="">-- No Cable Lengths Available --</option>`;
    return;
  }

  cableMenu.innerHTML = `<option value="">Checking stock...</option>`;
  cableMenu.disabled = true;

  try {
    const cablesWithStock = await Promise.all(
      availableCables.map(async cable => {
        const shopifyVariantId = cable.id.startsWith("gid://shopify/ProductVariant/")
          ? cable.id
          : `gid://shopify/ProductVariant/${cable.id}`;

        try {
          const availableForSale = await checkStock(shopifyVariantId);

          return {
            ...cable,
            availableForSale,
            inStock: availableForSale !== false
          };
        } catch (error) {
          console.error("[updateCableDropdown] stock check failed for cable:", cable, error);

          return {
            ...cable,
            availableForSale: null,
            inStock: true
          };
        }
      })
    );

    cableMenu.innerHTML = cablesWithStock.map(c => `
              <option
                value="${c.id}"
                data-conn="${c.conn}"
                ${c.inStock ? "" : "disabled"}
              >
                ${c.length} (${c.conn})${c.inStock ? "" : " - Out of stock"}
              </option>
          `).join("");
  } catch (error) {
    console.error("[updateCableDropdown] unexpected failure:", error);

    cableMenu.innerHTML = availableCables.map(c => `
              <option value="${c.id}" data-conn="${c.conn}">
                ${c.length} (${c.conn}) - Stock check unavailable
              </option>
          `).join("");
  } finally {
    cableMenu.disabled = false;
  }
}

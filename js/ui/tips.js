//   selectTipStyle
//   setTipLength
//   renderTipLengths
//   populateTipDiameters

import {state} from "../state.js";
import {DB_TIPS} from "../catalogue/data.js";
import {checkStock} from "../apiQuery.js";


export function selectTipStyle(style) {
  state.activeTipStyle = style;
  document.querySelectorAll("#carousel-tip-styles .carousel-item").forEach(el => {
    el.classList.toggle("selected", el.innerText.includes(style));
  });
  renderTipLengths();
}

export function setTipLength(length) {
  state.activeTipLength = length;
  renderTipLengths();
}

function renderTipLengths() {
  const wrapper = document.getElementById("carousel-tip-lengths");
  let lengths = [...new Set(DB_TIPS.filter(t => t.style === state.activeTipStyle).map(t => t.length))];

  if (!lengths.includes(state.activeTipLength)) {
    state.activeTipLength = lengths[0] || "5in";
  }

  wrapper.innerHTML = lengths.map(l => `
          <div class="carousel-item ${l === state.activeTipLength ? 'selected' : ''}" data-length="${l}">
              ${l}
          </div>
      `).join("");

  populateTipDiameters();
}

async function populateTipDiameters() {
  const diaMenu = document.getElementById("tipDiameter");


  if (!diaMenu) {
    console.error("[populateTipDiameters] Could not find #tipDiameter");
    return;
  }

  const targetTips = DB_TIPS.filter(t =>
    t.style === state.activeTipStyle &&
    t.length === state.activeTipLength
  );



  if (targetTips.length === 0) {
    diaMenu.innerHTML = `<option value="">-- No Tips Available --</option>`;
    return;
  }

  diaMenu.innerHTML = `<option value="">Checking stock...</option>`;
  diaMenu.disabled = true;

  try {
    const tipsWithStock = await Promise.all(
      targetTips.map(async tip => {
        const shopifyVariantId = tip.id.startsWith("gid://shopify/ProductVariant/")
          ? tip.id
          : `gid://shopify/ProductVariant/${tip.id}`;


        try {
          const availableForSale = await checkStock(shopifyVariantId);

        //  console.log("[populateTipDiameters] stock result:", {
        //    id: tip.id,
       //     size: tip.size,
        //    availableForSale
       //   });

          return {
            ...tip,
            availableForSale,
            inStock: availableForSale !== false
          };
        } catch (error) {
          console.error("[populateTipDiameters] stock check failed for tip:", tip, error);

          return {
            ...tip,
            availableForSale: null,
            inStock: true
          };
        }
      })
    );

    //console.log("[populateTipDiameters] tipsWithStock:", tipsWithStock);
    //console.table(tipsWithStock);

    diaMenu.innerHTML = tipsWithStock.map(t => `
            <option
              value="${t.id}"
              data-conn="${t.conn}"
              ${t.inStock ? "" : "disabled"}
            >
              ${t.size} (${t.conn})${t.inStock ? "" : " - Out of stock"}
            </option>
        `).join("");

    //console.log("[populateTipDiameters] final option count:", diaMenu.options.length);
  } catch (error) {
    console.error("[populateTipDiameters] unexpected failure:", error);

    diaMenu.innerHTML = targetTips.map(t => `
            <option value="${t.id}" data-conn="${t.conn}">
              ${t.size} (${t.conn}) - Stock check unavailable
            </option>
        `).join("");
  } finally {
    diaMenu.disabled = false;
  }
}

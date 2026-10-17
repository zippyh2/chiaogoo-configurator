import {DB_TIPS} from "./catalogue/data.js";
import {state} from "./state.js";


import {selectTipStyle, setTipLength} from "./ui/tips.js";
import {selectCableType, updateCableDropdown} from "./ui/cables.js";
import {addSelectedAccessoryFromModal,
        closeAccessoryModal,
        openAccessoryModal,
        selectAccessoryModalOption
      } from "./ui/accessories.js";
import {closeCompatibilityModal, toggleCompatibilityDetails} from "./ui/compatibilityModal.js"
import {continueToShopifyAnyway, sendProjectToShopify} from "./checkout/shopify.js";
import {readProjectBasketFromStorage} from "./basket/basketStorage.js";
import {addItemToProjectBasket,
        addMissingAdaptorFromModal,
        removeBasketItem,
        renderProjectBasketList
      } from "./basket/basket.js";



// --- Wire up Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {

  // 1. Tip Style Selection Carousel
  document.querySelectorAll('.tip-style-btn').forEach(item => {
    item.addEventListener('click', (e) => {
      const selectedStyle = e.currentTarget.getAttribute('data-style');
      selectTipStyle(selectedStyle);
    });
  });

  // 2. Cable Type Selection Carousel
  document.querySelectorAll('.cable-type-btn').forEach(item => {
    item.addEventListener('click', (e) => {
      const selectedType = e.currentTarget.getAttribute('data-type');
      selectCableType(selectedType);
    });
  });

  // 3. Basket Action Buttons
  document.getElementById('addTipBtn').addEventListener('click', () => addItemToProjectBasket('TIP'));
  document.getElementById('addCableBtn').addEventListener('click', () => addItemToProjectBasket('CABLE'));
  document.getElementById('checkoutBtn').addEventListener('click', sendProjectToShopify);

  // 4. Accessory Upgrade Grid Buttons
  document.getElementById('openAdapterModalBtn').addEventListener('click', () => openAccessoryModal('ADAPTER'));
  document.getElementById('openUpsellModalBtn').addEventListener('click', () => openAccessoryModal('UPSELL'));

  // 5. Compatibility Warning Modal Buttons
  document.getElementById('compatibilityDetailsToggle').addEventListener('click', toggleCompatibilityDetails);
  document.getElementById('closeCompatibilityModalBtn').addEventListener('click', closeCompatibilityModal);
  document.getElementById('compatibilityContinueBtn').addEventListener('click', continueToShopifyAnyway);

  // 6. Accessory Selection Modal Buttons
  document.getElementById('addSelectedAccessoryBtn').addEventListener('click', addSelectedAccessoryFromModal);
  document.getElementById('closeAccessoryModalBtn').addEventListener('click', closeAccessoryModal);

});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('carousel-tip-lengths').addEventListener('click', (e) => {
    const targetItem = e.target.closest('.carousel-item');
    if (targetItem) {
      const chosenLength = targetItem.getAttribute('data-length');
      setTipLength(chosenLength);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('project-basket-list').addEventListener('click', (e) => {
    // Look for the closest element matching the cross button class name
    const removeBtn = e.target.closest('.remove-btn');

    if (removeBtn) {
      const itemIdx = parseInt(removeBtn.getAttribute('data-index'), 10);

      removeBasketItem(itemIdx);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('missingAdaptorActions').addEventListener('click', (e) => {
    // Look for the closest missing-adaptor-btn that was clicked
    const btn = e.target.closest('.missing-adaptor-btn');

    if (btn) {
      const targetKey = btn.getAttribute('data-key');

      addMissingAdaptorFromModal(targetKey, btn);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('accessoryModalOptions').addEventListener('click', (e) => {
    // Look for the closest option button element that was clicked
    const optionBtn = e.target.closest('.accessory-modal-option');

    if (optionBtn) {
      const chosenKey = optionBtn.getAttribute('data-key');

      selectAccessoryModalOption(chosenKey);

      document.querySelectorAll('#accessoryModalOptions .accessory-modal-option').forEach(btn => {
        btn.classList.toggle('selected', btn.getAttribute('data-key') === chosenKey);
      });
    }
  });

});


// --- 4. DEFAULT INITIALIZATION RUN ---
function bootWorkspace() {
  selectTipStyle("TWIST");
  setTipLength("5in");
  updateCableDropdown();


  const diaMenu = document.getElementById("tipDiameter");
  const target4mm = DB_TIPS.find(t => t.style === "TWIST" && t.length === "5in" && t.size === "4mm");

  if (target4mm && diaMenu) {
    diaMenu.value = target4mm.id;
  }

  const modalOverlay = document.getElementById("compatibilityModalOverlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", event => {
      if (event.target === modalOverlay) {
        closeCompatibilityModal();
      }
    });
  }

  const accessoryModalOverlay = document.getElementById("accessoryModalOverlay");
  if (accessoryModalOverlay) {
    accessoryModalOverlay.addEventListener("click", event => {
      if (event.target === accessoryModalOverlay) {
        closeAccessoryModal();
      }
    });
  }
  state.projectBasket = readProjectBasketFromStorage();
  renderProjectBasketList();
}

window.onload = bootWorkspace;

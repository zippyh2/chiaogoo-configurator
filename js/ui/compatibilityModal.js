//   openCompatibilityModal
//   closeCompatibilityModal
//   renderCompatibilityCoverageSummary
//   renderCompatibilityDetails
//   toggleCompatibilityDetails
//   updateCompatibilityModalAfterAdaptorChange

import {ADAPTER_LABELS} from "../constants.js";

import {
  formatGroupedItemList,
  getAdaptorLabelList,
  getFailedConnectorGroupLabel
} from "../compatibility/compatibilityFormatting.js";
import {
  addUniqueItem,
  analyzeProjectBasketCompatibility,
  getProjectBasketCoverageSummary,
  validateProjectBasketCompatibility
} from "../compatibility/compatibility.js";


export function openCompatibilityModal(messages, missingAdaptorKeys = []) {
  const overlay = document.getElementById("compatibilityModalOverlay");
  const introEl = document.getElementById("compatibilityModalIntro");
  const coverageEl = document.getElementById("compatibilityModalCoverage");
  const messageEl = document.getElementById("compatibilityModalMessage");
  const actionsEl = document.getElementById("missingAdaptorActions");
  const noteEl = document.getElementById("compatibilityModalNote");
  const continueBtn = document.getElementById("compatibilityContinueBtn");

  const hasMissingAdaptors = missingAdaptorKeys.length > 0;

  introEl.textContent = hasMissingAdaptors
    ? "Some parts in your bundle may need an adaptor."
    : "Some parts in your bundle may not fit together.";

  renderCompatibilityCoverageSummary(coverageEl);

  messageEl.textContent = messages.join("\n\n");

  actionsEl.innerHTML = missingAdaptorKeys.map(adaptorKey => `
          <button type="button"
                  class="missing-adaptor-btn"
                  data-key="${adaptorKey}">
            + Add ${ADAPTER_LABELS[adaptorKey]}
          </button>
        `).join("");

  renderCompatibilityDetails();

  noteEl.style.display = "";
  const analysis = analyzeProjectBasketCompatibility();
  const hasImpossibleOrUnusedItems = analysis.unusedItems.length > 0 ||
    analysis.pairResults.some(pair => pair.status === "fail");

  noteEl.style.display = "";

  if (hasMissingAdaptors && hasImpossibleOrUnusedItems) {
    noteEl.textContent = "If you already own the required adaptor(s), or you dont need the combinations that require them, continue anyway.\n\nOtherwise, add them here or go back to adjust your project bundle.";
  } else if (hasMissingAdaptors) {
    noteEl.textContent = "If you already own the required adaptor(s), or these parts match ones you already own, continue anyway.\n\nOtherwise, add them here or go back to adjust your project bundle.";
  } else {
    noteEl.textContent = "Some selected parts may be for use with other items you already own.\n\nCheck the full compatibility details if you are unsure.";
  }
  continueBtn.textContent = "Continue anyway";

  const detailsEl = document.getElementById("compatibilityDetails");
  const detailsToggleEl = document.getElementById("compatibilityDetailsToggle");

  detailsEl.classList.remove("visible");
  detailsToggleEl.textContent = "▼ Show full compatibility details";

  overlay.classList.add("visible");
}

export function closeCompatibilityModal() {
  const overlay = document.getElementById("compatibilityModalOverlay");

  overlay.classList.remove("visible");
}

export function toggleCompatibilityDetails() {
  const detailsEl = document.getElementById("compatibilityDetails");
  const toggleEl = document.getElementById("compatibilityDetailsToggle");
  const isVisible = detailsEl.classList.toggle("visible");

  toggleEl.textContent = isVisible
    ? "▲ Hide compatibility details"
    : "▼ Show full compatibility details";
}

export function updateCompatibilityModalAfterAdaptorChange() {
  const validation = validateProjectBasketCompatibility();
  const introEl = document.getElementById("compatibilityModalIntro");
  const coverageEl = document.getElementById("compatibilityModalCoverage");
  const messageEl = document.getElementById("compatibilityModalMessage");
  const actionsEl = document.getElementById("missingAdaptorActions");
  const noteEl = document.getElementById("compatibilityModalNote");
  const continueBtn = document.getElementById("compatibilityContinueBtn");
  renderCompatibilityCoverageSummary(coverageEl);
  renderCompatibilityDetails();

  if (validation.ok) {
    introEl.textContent = "Your adaptor check is sorted.";
    messageEl.textContent = "Great — the required adaptor(s) have been added. This bundle is ready to continue.";
    actionsEl.innerHTML = "";
    noteEl.style.display = "none";
    continueBtn.textContent = "Continue";
    return;
  }

  if (validation.missingAdaptorKeys.length === 0) {
    introEl.textContent = "Some parts in your bundle may still not fit.";
    messageEl.textContent = validation.messages.join("\n\n");
    actionsEl.innerHTML = "";
    noteEl.style.display = "";
    noteEl.textContent = "This connector combination cannot be solved with an adaptor. Continue only if you are buying these parts for another project, or you already have other matching parts.";
    continueBtn.textContent = "Continue anyway";
    return;
  }

  introEl.textContent = "Some parts in your bundle may need an adaptor.";
  messageEl.textContent = validation.messages.join("\n\n");

  actionsEl.innerHTML = validation.missingAdaptorKeys.map(adaptorKey => `
      <button type="button"
              class="missing-adaptor-btn"
              data-key="${adaptorKey}">
        + Add ${ADAPTER_LABELS[adaptorKey]}
      </button>
    `).join("");

  noteEl.style.display = "";
  const refreshedAnalysis = analyzeProjectBasketCompatibility();
  const stillHasImpossibleOrUnusedItems = refreshedAnalysis.unusedItems.length > 0 ||
    refreshedAnalysis.pairResults.some(pair => pair.status === "fail");

  if (stillHasImpossibleOrUnusedItems) {
    noteEl.textContent = "If you already own the required adaptor(s), or you dont need the combinations that require them, continue anyway.\n\nOtherwise, add them here or go back to adjust your project bundle.";
  } else {
    noteEl.textContent = "If you already own the required adaptor(s), or these parts match ones you already own, continue anyway.\n\nOtherwise, add them here or go back to adjust your project bundle.";
  }

  continueBtn.textContent = "Continue anyway";
}

function renderCompatibilityCoverageSummary(coverageEl) {
  const coverageSummary = getProjectBasketCoverageSummary();

  if (!coverageSummary) {
    coverageEl.textContent = "";
    coverageEl.style.display = "none";
    coverageEl.className = "compatibility-modal-good-news";
    return;
  }

  coverageEl.textContent = coverageSummary.text;
  coverageEl.style.display = "";
  coverageEl.className = coverageSummary.type === "warning"
    ? "compatibility-modal-attention"
    : "compatibility-modal-good-news";
}

function renderCompatibilityDetails() {
  const detailsEl = document.getElementById("compatibilityDetails");
  const toggleEl = document.getElementById("compatibilityDetailsToggle");
  const analysis = analyzeProjectBasketCompatibility();

  if (!analysis.hasTipsAndCables) {
    detailsEl.innerHTML = "";
    detailsEl.classList.remove("visible");
    toggleEl.style.display = "none";
    return;
  }

  toggleEl.style.display = "";

  const detailSections = [];

  Object.values(analysis.groups.needsAdaptor).forEach(group => {
    detailSections.push(`
          <div class="compatibility-detail-row compatibility-detail-adapter-needed">
            <strong>🟡 Needs ${getAdaptorLabelList(group.adaptorKeys)}</strong>
            <div><strong>Tip(s):</strong></div>
            <div>${formatGroupedItemList(group.tips)}</div>
            <div><strong>With cable(s):</strong></div>
            <div>${formatGroupedItemList(group.cables)}</div>
          </div>
        `);
  });

  Object.values(analysis.groups.worksWithAdaptorInBasket).forEach(group => {
    detailSections.push(`
          <div class="compatibility-detail-row compatibility-detail-adapter-in-basket">
            <strong>✅ Using ${getAdaptorLabelList(group.adaptorKeys)} in your basket</strong>
            <div><strong>Tip(s):</strong></div>
            <div>${formatGroupedItemList(group.tips)}</div>
            <div><strong>With cable(s):</strong></div>
            <div>${formatGroupedItemList(group.cables)}</div>
          </div>
        `);
  });

  Object.entries(analysis.groups.worksDirectly).forEach(([connectorSize, group]) => {
    detailSections.push(`
          <div class="compatibility-detail-row compatibility-detail-direct">
            <strong>✅ Fit directly (${connectorSize} connector)</strong>
            <div><strong>Tip(s):</strong></div>
            <div>${formatGroupedItemList(group.tips)}</div>
            <div><strong>With cable(s):</strong></div>
            <div>${formatGroupedItemList(group.cables)}</div>
          </div>
        `);
  });

  const failedGroups = {};

  analysis.pairResults
    .filter(pair => pair.status === "fail")
    .forEach(pair => {
      const groupKey = `${pair.tip.conn}_${pair.cable.conn}`;

      if (!failedGroups[groupKey]) {
        failedGroups[groupKey] = {
          label: getFailedConnectorGroupLabel(pair.tip.conn, pair.cable.conn),
          tips: [],
          cables: [],
          reasons: new Set()
        };
      }

      addUniqueItem(failedGroups[groupKey].tips, pair.tip);
      addUniqueItem(failedGroups[groupKey].cables, pair.cable);
      failedGroups[groupKey].reasons.add(pair.message);
    });

  Object.values(failedGroups).forEach(group => {
    detailSections.push(`
          <div class="compatibility-detail-row compatibility-detail-fail">
            <strong>❌ ${group.label} cannot be adapted to work together</strong>
            <div><strong>Tip(s):</strong></div>
            <div>${formatGroupedItemList(group.tips)}</div>
            <div><strong>Cable(s):</strong></div>
            <div>${formatGroupedItemList(group.cables)}</div>
            <div>${[...group.reasons].join(" ")}</div>
          </div>
        `);
  });

  if (analysis.accessoryWarnings.length > 0) {
    detailSections.push(`
          <div class="compatibility-detail-row compatibility-detail-adapter-needed">
            <strong>🟡 Accessory check</strong>
            <div>${analysis.accessoryWarnings.map(warning => `• ${warning}`).join("\n")}</div>
          </div>
        `);
  }

  if (detailSections.length === 0) {
    detailSections.push(`
          <div class="compatibility-detail-row compatibility-detail-direct">
            <strong>✅ No compatibility problems found</strong>
            <div>The selected tips and cables appear to work together.</div>
          </div>
        `);
  }

  detailsEl.innerHTML = detailSections.join("");
}


//   analyzeProjectBasketCompatibility
//   validateProjectBasketCompatibility
//   getProjectBasketCoverageSummary
//   addUniqueItem
//   checkTipCableCompatibility


import {state} from "../state.js";

import {getAdaptorLabelList} from "./compatibilityFormatting.js";
import {CONNECTOR_RANK} from "../constants.js";
import {REQUIRED_ADAPTER_BY_PAIR} from "../catalogue/data.js";
import {projectBasketHasAdaptor} from "../basket/basket.js";

export function getProjectBasketCoverageSummary() {
  return analyzeProjectBasketCompatibility().summary;
}


export function addUniqueItem(targetArray, item) {
  if (!targetArray.some(existingItem => existingItem.id === item.id)) {
    targetArray.push(item);
  }
}

export function analyzeProjectBasketCompatibility() {
  const tips = state.projectBasket.filter(item => item.type === "TIP");
  const cables = state.projectBasket.filter(item => item.type === "CABLE");
  const upsells = state.projectBasket.filter(item => item.type === "UPSELL");

  const analysis = {
    ok: true,
    hasTipsAndCables: tips.length > 0 && cables.length > 0,
    missingAdaptorKeys: [],
    messages: [],
    pairResults: [],
    unusedItems: [],
    accessoryWarnings: [],
    summary: null,
    groups: {
      needsAdaptor: {},
      worksDirectly: {},
      worksWithAdaptorInBasket: {},
      cannotWork: {
        tips: [],
        cables: []
      }
    }
  };

  const selectedCableConnectors = new Set(cables.map(cable => cable.conn));

  upsells.forEach(upsell => {
    if (!selectedCableConnectors.has(upsell.upsellKey)) {
      analysis.accessoryWarnings.push(
        `${upsell.nameHuman} may not match any selected cable in this bundle.`
      );
    }
  });

  if (!analysis.hasTipsAndCables) {
    if (analysis.accessoryWarnings.length > 0) {
      analysis.messages.push(...analysis.accessoryWarnings);
      analysis.ok = false;
    }

    return analysis;
  }

  const missingAdaptorSet = new Set();
  const usableTipIndexes = new Set();
  const usableCableIndexes = new Set();

  let directMatchCount = 0;
  let adaptorInBasketCount = 0;
  let adaptorNeededCount = 0;
  let impossibleCount = 0;

  tips.forEach((tip, tipIndex) => {
    cables.forEach((cable, cableIndex) => {
      const adaptorKeys = REQUIRED_ADAPTER_BY_PAIR[`${tip.conn}_${cable.conn}`] || [];
      const missingAdaptorKeysForPair = adaptorKeys.filter(adaptorKey => !projectBasketHasAdaptor(adaptorKey));
      const hasAdaptor = adaptorKeys.length > 0 && missingAdaptorKeysForPair.length === 0;
      const result = checkTipCableCompatibility(tip.conn, cable.conn, hasAdaptor);
      const adaptorGroupKey = adaptorKeys.join("+");
      const missingAdaptorGroupKey = missingAdaptorKeysForPair.join("+");

      let status = "fail";
      let message = "";

      if (result.ok && !result.needsAdaptor) {
        status = "direct";
        directMatchCount++;
        message = "Fits directly.";
        usableTipIndexes.add(tipIndex);
        usableCableIndexes.add(cableIndex);
      } else if (result.ok && result.needsAdaptor) {
        status = "adapter-in-basket";
        adaptorInBasketCount++;
        message = `Using ${getAdaptorLabelList(adaptorKeys)} in your basket.`;
        usableTipIndexes.add(tipIndex);
        usableCableIndexes.add(cableIndex);
      } else if (result.needsAdaptor && adaptorKeys.length > 0) {
        status = "adapter-needed";
        adaptorNeededCount++;
        missingAdaptorKeysForPair.forEach(adaptorKey => missingAdaptorSet.add(adaptorKey));
        message = `Needs ${getAdaptorLabelList(missingAdaptorKeysForPair)}.`;
        usableTipIndexes.add(tipIndex);
        usableCableIndexes.add(cableIndex);
      } else {
        status = "fail";
        impossibleCount++;
        message = result.reason;
      }

      if (status === "direct") {
        if (!analysis.groups.worksDirectly[tip.conn]) {
          analysis.groups.worksDirectly[tip.conn] = {
            tips: [],
            cables: []
          };
        }

        addUniqueItem(analysis.groups.worksDirectly[tip.conn].tips, tip);
        addUniqueItem(analysis.groups.worksDirectly[tip.conn].cables, cable);
      }

      if (status === "adapter-in-basket" && adaptorGroupKey) {
        if (!analysis.groups.worksWithAdaptorInBasket[adaptorGroupKey]) {
          analysis.groups.worksWithAdaptorInBasket[adaptorGroupKey] = {
            tips: [],
            cables: [],
            adaptorKeys
          };
        }

        addUniqueItem(analysis.groups.worksWithAdaptorInBasket[adaptorGroupKey].tips, tip);
        addUniqueItem(analysis.groups.worksWithAdaptorInBasket[adaptorGroupKey].cables, cable);
      }

      if (status === "adapter-needed" && missingAdaptorGroupKey) {
        if (!analysis.groups.needsAdaptor[missingAdaptorGroupKey]) {
          analysis.groups.needsAdaptor[missingAdaptorGroupKey] = {
            tips: [],
            cables: [],
            adaptorKeys: missingAdaptorKeysForPair
          };
        }

        addUniqueItem(analysis.groups.needsAdaptor[missingAdaptorGroupKey].tips, tip);
        addUniqueItem(analysis.groups.needsAdaptor[missingAdaptorGroupKey].cables, cable);
      }

      if (status === "fail") {
        addUniqueItem(analysis.groups.cannotWork.tips, tip);
        addUniqueItem(analysis.groups.cannotWork.cables, cable);
      }

      analysis.pairResults.push({
        tip,
        cable,
        tipIndex,
        cableIndex,
        status,
        adaptorKeys,
        message
      });
    });
  });

  const unusedTips = tips.filter((tip, tipIndex) => !usableTipIndexes.has(tipIndex));
  const unusedCables = cables.filter((cable, cableIndex) => !usableCableIndexes.has(cableIndex));

  analysis.unusedItems = [...unusedTips, ...unusedCables];
  analysis.missingAdaptorKeys = [...missingAdaptorSet];

  analysis.messages = [];

  if (analysis.missingAdaptorKeys.includes("Large_to_Small")) {
    analysis.messages.push("Some selected pairings need a Large to Small Adaptor.");
  }

  if (analysis.missingAdaptorKeys.includes("Small_to_Mini")) {
    analysis.messages.push("Some selected pairings need a Small to Mini Adaptor.");
  }

  if (impossibleCount > 0 && analysis.unusedItems.length === 0) {
    analysis.messages.push("Some selected cross-combinations cannot be adapted, but every selected tip and cable has at least one possible match.");
  } else if (impossibleCount > 0 || analysis.unusedItems.length > 0) {
    analysis.messages.push("At least one selected item cannot be adapted to work with the others.");
  }

  if (analysis.accessoryWarnings.length > 0) {
    analysis.messages.push(...analysis.accessoryWarnings);
  }

  analysis.ok = analysis.messages.length === 0;

  const pairCount = tips.length * cables.length;
  const unusedCount = analysis.unusedItems.length;

  if (unusedCount > 0) {
    const unusedNames = analysis.unusedItems
      .map(item => `• ${item.nameHuman}`)
      .join("\n");

    analysis.summary = {
      type: "warning",
      text: `${unusedCount} selected item${unusedCount > 1 ? "s do" : " does"} not currently match any other selected tip or cable:\n\n${unusedNames}`
    };
  } else if (pairCount === 1 && adaptorNeededCount === 1) {
    analysis.summary = {
      type: "warning",
      text: "This tip and cable combination is OK if you add, or already own, the recommended adaptor."
    };
  } else if (pairCount === 1 && adaptorInBasketCount === 1) {
    analysis.summary = {
      type: "good",
      text: "Good news: this tip and cable combination works with the adaptor in your basket."
    };
  } else if (pairCount === 1 && directMatchCount === 1) {
    analysis.summary = {
      type: "good",
      text: "Good news: this tip and cable combination fits directly."
    };
  } else if (adaptorNeededCount > 0 && impossibleCount === 0) {
    analysis.summary = {
      type: "warning",
      text: "Every selected tip and cable has a possible match, but some combinations need the recommended adaptor(s)."
    };
  } else if (adaptorInBasketCount > 0 && adaptorNeededCount === 0 && impossibleCount === 0) {
    analysis.summary = {
      type: "good",
      text: "Good news: every selected tip and cable can be used with the adaptor(s) in your basket."
    };
  } else if (impossibleCount > 0 && unusedCount === 0) {
    analysis.summary = {
      type: "warning",
      text: "All selected tips and cables can be used in at least one pairing, but some cross-combinations will not work together."
    };
  } else if (impossibleCount > 0) {
    analysis.summary = {
      type: "warning",
      text: "Some selected combinations cannot work together. You can continue if you are buying those parts for other items you already own."
    };
  } else {
    analysis.summary = {
      type: "good",
      text: "Good news: every selected tip and cable can be used without adaptors."
    };
  }

  return analysis;
}

export function validateProjectBasketCompatibility() {
  const analysis = analyzeProjectBasketCompatibility();

  return {
    ok: analysis.ok,
    messages: analysis.messages,
    missingAdaptorKeys: analysis.missingAdaptorKeys,
    accessoryWarnings: analysis.accessoryWarnings
  };
}

function checkTipCableCompatibility(tipConn, cableConn, hasAdaptor = false) {
  const tipRank = CONNECTOR_RANK[tipConn];
  const cableRank = CONNECTOR_RANK[cableConn];

  if (!tipRank || !cableRank) {
    return {
      ok: false,
      needsAdaptor: false,
      reason: "Unknown connector size."
    };
  }

  if (tipRank === cableRank) {
    return {
      ok: true,
      needsAdaptor: false,
      reason: "Tip and cable connectors match."
    };
  }

  if (tipRank > cableRank) {
    return {
      ok: hasAdaptor,
      needsAdaptor: true,
      reason: hasAdaptor
        ? "Compatible using adaptor(s)."
        : "This combination needs adaptor(s)."
    };
  }

  if (cableRank > tipRank) {
    return {
      ok: false,
      needsAdaptor: false,
      reason: "The cable connector is larger than the tip connector, so this cannot be fixed with an adaptor."
    };
  }

  return {
    ok: false,
    needsAdaptor: false,
    reason: "These connector sizes are not compatible."
  };
}

//   getAdaptorLabelList
//   formatGroupedItemList
//   getFailedConnectorGroupLabel

import {ADAPTER_LABELS} from "../constants.js";

export function getAdaptorLabelList(adaptorKeys = []) {
  return adaptorKeys.map(adaptorKey => ADAPTER_LABELS[adaptorKey]).join(" and ");
}

export function formatGroupedItemList(items) {
  return items.map(item => `• ${item.nameHuman}`).join("\n");
}

export function getFailedConnectorGroupLabel(tipConn, cableConn) {
  if (tipConn === "Mini" && cableConn === "Small") {
    return "Mini tip(s) with Small cable(s)";
  }

  if (tipConn === "Mini" && cableConn === "Large") {
    return "Mini tip(s) with Large cable(s)";
  }

  if (tipConn === "Small" && cableConn === "Large") {
    return "Small tip(s) with Large cable(s)";
  }

  if (tipConn === "Large" && cableConn === "Mini") {
    return "Large tip(s) with Mini cable(s)";
  }

  return `${tipConn} tip(s) with ${cableConn} cable(s)`;
}

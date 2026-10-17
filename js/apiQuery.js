import {SHOPIFY_STORE_URL, SHOPIFY_API_KEY} from "./constants.js";

const stockAvailabilityCache = new Map();


export async function checkStock(variantId) {
  const stockResults = await checkStocks([variantId]);

  return stockResults.get(variantId) ?? null;
}


export async function checkStocks(variantIds) {
  const results = new Map();
  const idsToFetch = [];

  variantIds.forEach(variantId => {
    if (stockAvailabilityCache.has(variantId)) {
      results.set(variantId, stockAvailabilityCache.get(variantId));
    } else {
      idsToFetch.push(variantId);
    }
  });

  if (idsToFetch.length === 0) {
    return results;
  }

  const fetchedResults = await fetchVariantAvailabilities(idsToFetch);

  fetchedResults.forEach((availableForSale, variantId) => {
    stockAvailabilityCache.set(variantId, availableForSale);
    results.set(variantId, availableForSale);
  });

  return results;
}


async function fetchVariantAvailabilities(variantIds) {
  const query = `
    query getVariantStocks($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant {
          id
          title
          availableForSale
        }
      }
    }
  `;

  const url = `${SHOPIFY_STORE_URL}/api/2025-01/graphql.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_API_KEY,
    },
    body: JSON.stringify({
      query: query,
      variables: { ids: variantIds }
    }),
  });

  const result = await response.json();

  if (result.errors) {
    console.error("[checkStocks] Shopify GraphQL errors:", result.errors);
  }

  const availabilityById = new Map();

  if (!result.data || !Array.isArray(result.data.nodes)) {
    console.warn("[checkStocks] No Shopify nodes returned for:", variantIds);
    variantIds.forEach(variantId => availabilityById.set(variantId, null));
    return availabilityById;
  }

  result.data.nodes.forEach((node, index) => {
    const requestedId = variantIds[index];

    if (!node) {
      console.warn("[checkStocks] No Shopify variant found for:", requestedId);
      availabilityById.set(requestedId, null);
      return;
    }

    availabilityById.set(node.id || requestedId, node.availableForSale);
  });

  variantIds.forEach(variantId => {
    if (!availabilityById.has(variantId)) {
      availabilityById.set(variantId, null);
    }
  });

  return availabilityById;
}

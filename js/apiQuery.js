import {SHOPIFY_STORE_URL, SHOPIFY_API_KEY} from "./constants.js";

const stockAvailabilityCache = new Map();


export async function checkStock(variantId) {
  if (stockAvailabilityCache.has(variantId)) {
    //console.log("[checkStock] cache hit:", variantId);
    return stockAvailabilityCache.get(variantId);
  }

  const stockRequest = fetchVariantAvailability(variantId);

  stockAvailabilityCache.set(variantId, stockRequest);

  return stockRequest;
}


async function fetchVariantAvailability(variantId) {
  const query = `
    query getVariantStock($id: ID!) {
      node(id: $id) {
        ... on ProductVariant {
          title
          availableForSale
        }
      }
    }
  `;

  const url = `${SHOPIFY_STORE_URL}/api/2025-01/graphql.json`;

  //console.log("[checkStock] fetching:", variantId);
 // console.log("[checkStock] url:", url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_API_KEY,
    },
    body: JSON.stringify({
      query: query,
      variables: { id: variantId }
    }),
  });

  //console.log("[checkStock] response status:", response.status, response.statusText);

  const result = await response.json();

  //console.log("[checkStock] raw result:", result);

  if (result.errors) {
    console.error("[checkStock] Shopify GraphQL errors:", result.errors);
  }

  if (!result.data || !result.data.node) {
    console.warn("[checkStock] No Shopify variant found for:", variantId);
    return null;
  }

  return result.data.node.availableForSale;
}

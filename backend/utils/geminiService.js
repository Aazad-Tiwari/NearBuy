// Gemini AI Service — search enhancement and recommendations

/**
 * Call Gemini API using native fetch
 */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('dummy')) {
    console.warn('[gemini] API key missing or dummy. Skipping API call.');
    return null;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No content returned from Gemini');
    }

    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }

    return JSON.parse(text);
  } catch (err) {
    console.error('[gemini] Error calling Gemini API:', err.message);
    return null;
  }
}

/**
 * enhanceSearchQuery - corrects typos and expands synonyms/related categories
 */
async function enhanceSearchQuery(query) {
  if (!query || !query.trim()) return [query];
  
  const prompt = `You are a search query enhancement assistant. The user is searching for products in a local marketplace app. Fix typos, expand abbreviations, and add close synonyms/related categories for the query: "${query.trim()}". Respond ONLY with a valid JSON array of strings containing the query and enhanced terms (maximum 5 terms total). Do not include markdown code block formatting or explanations. Example input: "eloectronics", expected output: ["electronics", "gadget", "charger", "phone"].`;

  const result = await callGemini(prompt);
  if (Array.isArray(result) && result.length > 0) {
    return result;
  }

  // Fallback to original query
  return [query.trim()];
}

/**
 * getRecommendations - recommends available products based on past orders
 */
async function getRecommendations(pastOrders, availableProducts) {
  if (!availableProducts || availableProducts.length === 0) return [];

  // Limit available products description size to fit token constraints
  const simplifiedProducts = availableProducts.map(p => ({
    _id: p._id.toString(),
    name: p.name,
    category: p.category,
    description: p.description || ''
  })).slice(0, 30); // limit to 30 candidates for efficiency

  const prompt = `You are a shopping recommendation assistant. Based on the customer's purchase history of items: ${JSON.stringify(pastOrders)}, recommend the top 6 products from this list of available products: ${JSON.stringify(simplifiedProducts)}. Respond ONLY with a valid JSON array of strings containing the product _ids of the recommended products in order of relevance (exactly 6 IDs, or fewer if not enough products exist). Do not include markdown formatting or explanations.`;

  const result = await callGemini(prompt);
  if (Array.isArray(result) && result.length > 0) {
    return result.filter(id => typeof id === 'string');
  }

  // Fallback: return first 6 products
  return availableProducts.slice(0, 6).map(p => p._id.toString());
}

/**
 * matchShoppingList - maps user items to matching product IDs in the database
 */
async function matchShoppingList(items, products) {
  if (!items || items.length === 0 || !products || products.length === 0) {
    return {};
  }

  // Simplify products to minimize token usage
  const simplifiedProducts = products.map(p => ({
    id: p._id.toString(),
    name: p.name,
    category: p.category,
    description: p.description || ''
  }));

  const prompt = `You are a shopping list matching assistant for a local retail marketplace.
The user has submitted this shopping list of items they want to buy: ${JSON.stringify(items)}.
Our database has the following available products: ${JSON.stringify(simplifiedProducts)}.

Your job is to match each user's item to one or more product IDs from the database catalog.
- Handle spelling mistakes and typos (e.g. "aples" -> matches "Apples", "vitmin c" -> "Vitamin C").
- Handle different languages/common Indian terms (e.g. "sabun" matches soap/bodywash products, "doodh" matches milk, "seb" matches apples, "aaloo" matches potato).
- Handle synonyms (e.g. "sneakers" matches "Running Shoes", "medicine" matches "Dolo").
- If no product in the catalog is a reasonable match for a list item, return an empty array for that item.

Respond ONLY with a valid JSON object where keys are the exact items from the user's list, and values are arrays of matching product IDs. Do not include markdown code block formatting or explanations.
Example output:
{
  "aples": ["653b82...", "653b89..."],
  "sabun": ["653b91..."]
}`;

  const result = await callGemini(prompt);
  if (result && typeof result === 'object') {
    return result;
  }
  return {};
}

module.exports = {
  enhanceSearchQuery,
  getRecommendations,
  matchShoppingList
};

import * as functions from "firebase-functions";
import {onCall} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import axios, {isAxiosError} from "axios";
import {getFirestore} from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config();

initializeApp();

const db = getFirestore();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Extracts ingredients from a given recipe text using Gemini AI.
 *
 * @param {functions.https.CallableRequest<{ text: string }>} request
 * @returns {Promise<{ ingredients: { ingredient: string, measure: string }[] }>}
 */
/**
 * Preprocesses the input text to ensure a space exists between numbers and units.
 *
 * This function helps in handling cases where the user inputs measurements
 * like "250g" or "7ml" without spaces, converting them into "250 g" or "7 ml".
 *
 * @param {string} text - The input text containing ingredient measurements.
 * @return {string} - The modified text with spaces inserted between numbers and units.
 *
 * @example
 * preprocessText("250g sugar") // "250 g sugar"
 * preprocessText("7ml vanilla extract") // "7 ml vanilla extract"
 */
function preprocessText(text: string): string {
  return text.replace(/(\d+)([a-zA-Z]+)/g, "$1 $2"); // Ensure space between number & unit
}

/**
 * Extract ingredients from a given recipe text using Gemini AI.
 */
export const extractEntities = onCall(async (request) => {
  try {
    console.log("Function Called: extractEntities");

    if (!request.data || !request.data.text) {
      throw new functions.https.HttpsError("invalid-argument", "Text input is required.");
    }

    let text: string = request.data.text;
    text = preprocessText(text);

    console.log("Processing text with Gemini AI:", text);

    const prompt = `
      Extract all ingredients and their measurements from the following recipe text:
      ${text}

      **Rules:**
      - Only return structured JSON.
      - Preserve numbers and units exactly as written.
      - If an ingredient has no measurement, set measure as "unknown".
      - Return JSON in this exact format:
      
      [
        {"ingredient": "flour", "measure": "500 grams"},
        {"ingredient": "sugar", "measure": "100 grams"}
      ]
    `;

    const response = await axios.post(GEMINI_API_URL, {
      contents: [{role: "user", parts: [{text: prompt}]}],
    }, {
      headers: {"Content-Type": "application/json"},
    });

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("🔹 Gemini API Response:", rawText);

    let ingredients = [];
    try {
      const cleanedText = rawText.replace(/```json|```/g, "").trim();
      ingredients = JSON.parse(cleanedText);
    } catch (jsonError) {
      console.error("JSON Parsing Error:", jsonError, "Response:", rawText);
      throw new functions.https.HttpsError("internal", "Failed to process AI response.");
    }

    return {ingredients};
  } catch (error) {
    console.error("Firebase Function Error:", error);
    throw new functions.https.HttpsError("internal", "Failed to process text.");
  }
});

/**
 * Function 2: Scales Recipe Ingredients & Instructions Using Gemini AI.
 */
export const scaleRecipe = onCall(async (request) => {
  try {
    console.log("Function Called: scaleRecipe");

    if (!request.data || !request.data.recipe || !request.data.newServings) {
      throw new functions.https.HttpsError("invalid-argument", "Recipe data and newServings are required.");
    }

    const {recipe, newServings} = request.data;
    console.log(`Scaling recipe for ${newServings} servings...`);

    const prompt = `
      Scale this recipe for ${newServings} servings.

      **Original Recipe:**  
      ${JSON.stringify(recipe, null, 2)}

      **Rules:**  
      - Scale all ingredient amounts accurately.
      - Keep temperature, resting, proofing, and refrigeration times unchanged.
      - Round whole-number items like eggs and folds properly.
      - Ensure instructions remain natural and readable.
      - Return the output in structured JSON format.

      **Example Output JSON:**  
      {
        "ingredients": [
          {"name": "flour", "quantity": "750g"},
          {"name": "sugar", "quantity": "200g"}
        ],
        "instructions": [
          "Preheat oven to 180°C.",
          "Mix flour and sugar.",
          "Bake for 25 minutes."
        ]
      }
    `;

    const response = await axios.post(GEMINI_API_URL, {
      contents: [{role: "user", parts: [{text: prompt}]}],
    }, {
      headers: {"Content-Type": "application/json"},
    });

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("Gemini API Response:", rawText);

    let scaledRecipe;
    try {
      const cleanedText = rawText.replace(/```json|```/g, "").trim();
      scaledRecipe = JSON.parse(cleanedText);
    } catch (jsonError) {
      console.error("JSON Parsing Error:", jsonError, "Response:", rawText);
      throw new functions.https.HttpsError("internal", "Failed to process AI response.");
    }

    return {scaledRecipe};
  } catch (error) {
    console.error("Firebase Function Error:", error);
    throw new functions.https.HttpsError("internal", "Failed to scale recipe.");
  }
});

export const convertUnits = onCall(async (request) => {
  try {
    const {ingredient, quantity, inputUnit, outputUnit, region} = request.data;

    if (!ingredient || !quantity || !inputUnit || !outputUnit || !region) {
      throw new functions.https.HttpsError("invalid-argument", "Missing parameters.");
    }

    console.log(`🔍 Checking Firestore for: ${ingredient} - ${region} (${inputUnit} → ${outputUnit})`);

    const docRef = db.collection("ingredients").doc(ingredient);
    const doc = await docRef.get();

    if (doc.exists) {
      const ingredientData = doc.data();
      if (ingredientData?.conversions?.[region]?.[inputUnit] && ingredientData?.conversions?.[region]?.[outputUnit]) {
        const inputValue = ingredientData.conversions[region][inputUnit];
        const outputValue = ingredientData.conversions[region][outputUnit];

        const convertedQuantity = (quantity / inputValue) * outputValue;
        console.log(`Found in Firestore: ${quantity} ${inputUnit} = ${convertedQuantity.toFixed(2)} ${outputUnit}`);

        return {convertedQuantity: convertedQuantity.toFixed(2)};
      }
    }

    console.log("Not Found! Fetching conversion using Gemini API...");

    const prompt = `
      Convert ${quantity} ${inputUnit} of ${ingredient} into ${outputUnit} based on ${region} measurement standards.
      Provide only the numerical conversion value.
    `;

    const response = await axios.post(GEMINI_API_URL, {
      contents: [{role: "user", parts: [{text: prompt}]}],
    });

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const convertedQuantity = parseFloat(rawText);

    if (isNaN(convertedQuantity)) {
      throw new functions.https.HttpsError("internal", "Gemini API failed to return a valid conversion.");
    }

    console.log(`AI Conversion: ${quantity} ${inputUnit} = ${convertedQuantity} ${outputUnit}`);

    await docRef.set(
      {conversions: {[region]: {[inputUnit]: quantity, [outputUnit]: convertedQuantity}}},
      {merge: true}
    );

    return {convertedQuantity: convertedQuantity.toFixed(2)};
  } catch (error) {
    console.error("Error in conversion:", error);
    throw new functions.https.HttpsError("internal", "Failed to process unit conversion.");
  }
});


/**
 * Detects whether an image is of an ingredient or a baked product using Gemini AI.
 * If it's a baked product, the function also attempts to save the generated recipe to Firestore.
 *
 * @param {functions.https.CallableRequest<{ imageUrl: string }>} request - The request object.
 * @returns {Promise<{ detectedData: any }>} - An object containing the detected data (either ingredient or recipe).
 */
export const detectIngredientOrProduct = functions.https.onCall(async (request) => {
  interface VisionLabel {
    description: string;
  }

  try {
    console.log("📤 Received Image for Processing...");

    if (!request.data?.imageUrl) {
      throw new functions.https.HttpsError("invalid-argument", "Image URL is required.");
    }

    const imageUrl = request.data.imageUrl;
    console.log("Processing Image:", imageUrl);

    const VISION_API_KEY = process.env.VISION_API_KEY;
    const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

    // Cloud Vision API for Preprocessing
    const visionResponse = await axios.post(VISION_API_URL, {
      requests: [
        {
          image: {source: {imageUri: imageUrl}},
          features: [
            {type: "LABEL_DETECTION", maxResults: 10},
            {type: "OBJECT_LOCALIZATION", maxResults: 5}, // Improved object detection
          ],
        },
      ],
    });

    const labels = visionResponse.data.responses?.[0]?.labelAnnotations?.map((label: VisionLabel) => label.description) || [];
    console.log("🔍 Vision Labels:", labels);

    if (labels.length === 0) {
      throw new functions.https.HttpsError("not-found", "No recognizable objects found in image.");
    }

    const prompt = `
    Analyze the image from this URL: ${imageUrl}
    
    **Detected Features from Vision API**: ${labels.join(", ")}
  
    **Rules for Analysis**:
    - If the image contains a single ingredient, return JSON:
      {"type": "ingredient", "name": "ingredient name", "uses": ["common use 1", "common use 2"]}.
    - If the image is a baked product, return JSON:
      {"type": "baked_product", "recipe": {
        "name": "recipe name",
        "description": "short description",
        "ingredients": [
          {"ingredient": "ingredient name", "quantity": "quantity", "unit": "unit", "notes": "optional notes"}
        ],
        "steps": ["step 1", "step 2", "..."]
      }}.
    - If unsure, return JSON: {"type": "unknown"}.
    - Always return **only JSON output**. No extra text, explanations, or formatting.
  
    Ensure ingredient names are **concise and accurate**.
  `;

    const response = await axios.post(GEMINI_API_URL, {
      contents: [{role: "user", parts: [{text: prompt}]}],
    }, {headers: {"Content-Type": "application/json"}});

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("🤖 Gemini AI Response:", rawText);

    let detectedData;
    try {
      const cleanedText = rawText.replace(/```json|```/g, "").trim();
      detectedData = JSON.parse(cleanedText);
    } catch (jsonError) {
      console.error("🚨 JSON Parsing Error:", jsonError, "Response:", rawText);
      throw new functions.https.HttpsError("internal", "Failed to process AI response.");
    }

    // If AI returns "unknown", handle it gracefully
    if (detectedData.type === "unknown") {
      console.warn("⚠️ AI could not identify the image.");
      return {detectedData: {type: "unknown", message: "AI could not determine the ingredient or baked product."}};
    }

    if (!detectedData.type || (detectedData.type === "baked_product" && !detectedData.recipe?.name)) {
      console.error("🚨 Incomplete AI Response:", detectedData);
      throw new functions.https.HttpsError("internal", "AI response is incomplete.");
    }

    const userId = request.auth?.uid;
    if (detectedData.type === "baked_product" && userId) {
      const recipeRef = db.collection("users").doc(userId).collection("local_recipes").doc();
      await recipeRef.set({
        imageUrl,
        ...detectedData,
        createdAt: new Date(),
      });
      console.log("✅ Recipe saved to Firestore:", recipeRef.id);
    }

    return {detectedData};
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      console.error("❌ Axios Request Error:", error.response?.data || error.message);
      throw new functions.https.HttpsError(
        "internal",
        `Request failed: ${error.response?.status} - ${error.response?.statusText}`
      );
    }

    if (error instanceof Error) {
      console.error("❌ Error Processing Image:", error);
      throw new functions.https.HttpsError("internal", error.message || "Failed to analyze image.");
    }

    console.error("❌ Unknown Error Processing Image:", error);
    throw new functions.https.HttpsError("internal", "An unknown error occurred while processing the image.");
  }
});

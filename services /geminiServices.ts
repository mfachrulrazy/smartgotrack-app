import { GoogleGenAI, Type } from "@google/genai";
import { Purchase } from '../types';

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found in environment variables");
    }
    return new GoogleGenAI({ apiKey });
};

export interface ParsedPurchaseResponse {
    itemName: string;
    storeName: string;
    price: number;
    quantity: number;
    unit: string;
    date: string; // ISO format suggested by AI
    confidence: number;
}

export const parseShoppingInput = async (input: string): Promise<ParsedPurchaseResponse | null> => {
    try {
        const ai = getClient();
        const model = "gemini-3-pro-preview";

        const systemInstruction = `
        You are a smart shopping assistant for the app "SmartGotrack".
        Your goal is to extract structured shopping data from natural language user input.
        
        Current Date Reference: ${new Date().toISOString()}
        
        If the user input describes a purchase, extract the following fields:
        - itemName: The name of the product.
        - storeName: The name of the shop/store. If not specified, infer "Unknown Store".
        - price: The unit price if available, or calculate unit price from total if necessary.
        - quantity: The amount bought. Default to 1 if not specified.
        - unit: The unit of measure (e.g., kg, lbs, pack, box). Default to 'unit' if not specified.
        - date: The date of purchase in ISO 8601 format (YYYY-MM-DD). Parse "today", "yesterday", etc. relative to current date.
        
        If the input is NOT a purchase entry (e.g., general question), return null for all fields.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: input,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isPurchase: { type: Type.BOOLEAN },
                        data: {
                            type: Type.OBJECT,
                            properties: {
                                itemName: { type: Type.STRING },
                                storeName: { type: Type.STRING },
                                price: { type: Type.NUMBER },
                                quantity: { type: Type.NUMBER },
                                unit: { type: Type.STRING },
                                date: { type: Type.STRING },
                            }
                        },
                        responseMessage: { type: Type.STRING, description: "A friendly message confirming what was understood or asking for clarification." }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || "{}");
        
        if (json.isPurchase && json.data) {
            return {
                ...json.data,
                confidence: 0.9 // mocked confidence
            };
        }
        
        return null;

    } catch (error) {
        console.error("Error parsing input with Gemini:", error);
        return null;
    }
};

export const getChatReply = async (history: {role: string, content: string}[], message: string) => {
    try {
        const ai = getClient();
        const chat = ai.chats.create({
            model: "gemini-3-pro-preview",
            config: {
                systemInstruction: "You are a helpful assistant for SmartGotrack, a grocery expense tracker. Help users with budgeting advice, cooking tips based on ingredients, or general questions. Keep answers concise."
            },
            history: history.map(h => ({ role: h.role, parts: [{ text: h.content }] }))
        });

        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Chat error:", error);
        return "I'm having trouble connecting to the server right now. Please try again.";
    }
}

export const generateSpendingInsights = async (purchases: Purchase[]): Promise<string> => {
    try {
        const ai = getClient();
        const model = "gemini-3-flash-preview"; 

        // Simplified data for token efficiency
        const dataSummary = purchases.slice(0, 50).map(p => ({
            item: p.itemName,
            price: p.price,
            store: p.storeName,
            date: p.date,
            total: p.total
        }));

        const systemInstruction = `
            You are a helpful financial assistant. Analyze the grocery transaction history provided.
            Find patterns in spending, expensive items, or store choices.
            Provide 1 or 2 specific, friendly, and actionable tips to help the user save money.
            Focus on behaviour like: "You buy X frequently at high prices", "Store A is cheaper for Y", etc.
            Do not use markdown formatting like bold or headers. Just plain text or bullet points with unicode bullets.
            Keep it under 80 words.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: JSON.stringify(dataSummary),
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text || "No insights could be generated.";
    } catch (error) {
        console.error("Insight generation error:", error);
        return "I'm having trouble analyzing your data right now. Please try again later.";
    }
};

import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import { noticeExtractionPrompt } from '../prompts/noticeExtraction';
import { assistantPrompt } from '../prompts/assistant';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const model = 'gemini-1.5-flash';

export const extractNoticeDetails = async (title: string, rawText: string) => {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `${noticeExtractionPrompt}\n\nTitle: ${title}\n\nText:\n${rawText}`,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    const parsed = JSON.parse(jsonText);
    
    return {
      category: parsed.category,
      summary: parsed.summary,
      requirements: {
        branches: parsed.requirements?.branches || [],
        years: parsed.requirements?.years || [],
        minimumCGPA: parsed.requirements?.minimumCGPA || null,
        graduationYears: parsed.requirements?.graduationYears || [],
        skills: parsed.requiredSkills || [],
      },
      opportunity: {
        organization: parsed.organization || null,
        title: parsed.title || title,
        description: parsed.summary || rawText,
        location: parsed.location || null,
        category: parsed.category || 'GENERAL',
        deadline: parsed.deadline || null,
      }
    };
  } catch (error) {
    console.error('AI Extraction Error:', error);
    // Graceful fallback
    return {
      category: 'GENERAL',
      summary: null,
      requirements: {
        branches: [],
        years: [],
        minimumCGPA: null,
        graduationYears: [],
        skills: [],
      },
      opportunity: null
    };
  }
};

export const chatWithAssistant = async (message: string, context: any) => {
  try {
    const contextStr = JSON.stringify(context, null, 2);
    
    const response = await ai.models.generateContent({
      model,
      contents: `${assistantPrompt}\n\n${contextStr}\n\nUser Question:\n${message}`,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    return JSON.parse(jsonText);
  } catch (error) {
    console.error('AI Assistant Error:', error);
    return {
      answer: "I'm having trouble processing that right now. Please try again later.",
      intent: "GENERAL_QUERY",
      opportunities: [],
      tasks: [],
      deadlines: []
    };
  }
};

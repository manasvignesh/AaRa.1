import { Router } from "express";
import { z } from "zod";

import { storage } from "../storage";
import { askAARA, suggestFromIngredients, type AaraDayContext, type AaraUserProfile } from "../services/aara-ai";

const router = Router();

const messageSchema = z.object({
  message: z.string().min(1).max(2000),
  contextType: z
    .enum([
      "general",
      "meal_advice",
      "workout_advice",
      "hostel_mode",
      "cheat_meal",
      "ingredient_suggest",
      "weight_category",
    ])
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
});

const ingredientSchema = z.object({
  ingredients: z.array(z.string()).min(1).max(20),
  cookingMethod: z.enum(["no_cook", "kettle", "microwave", "stovetop", "oven"]),
  remainingCalories: z.number().min(0).max(3000),
  remainingProtein: z.number().min(0).max(300),
});

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated?.()) return next();
  return res.status(401).json({ error: "Not authenticated" });
};

const buildUserContext = async (userId: number): Promise<{ profile: AaraUserProfile; dayContext: AaraDayContext }> => {
  const profile = await storage.getUserProfile(userId);
  if (!profile) throw new Error("Profile not found");

  const today = new Date().toISOString().split("T")[0];
  const plan = await storage.getDailyPlan(userId, today);
  const gamification = await storage.getGamificationProfile(userId);
  const weightHistory = await storage.getWeightHistory(userId);

  const currentWeight = Number(profile.currentWeight || 0);
  const previousWeight = Number(weightHistory[1]?.weight ?? currentWeight);
  const weightTrend =
    currentWeight < previousWeight ? "losing" : currentWeight > previousWeight ? "gaining" : "stable";

  return {
    profile: {
      userId,
      userName: profile.displayName || "there",
      age: Number(profile.age || 25),
      gender: String(profile.gender || "male"),
      region: String(profile.regionPreference || "pan_india"),
      dietType: String(profile.dietaryPreferences || "veg"),
      primaryGoal: String(profile.primaryGoal || "maintain"),
      livingSituation: profile.cookingAccess === "none" ? "hostel" : "home",
      currentWeight,
      targetWeight: Number(profile.targetWeight || currentWeight),
      heightCm: Number(profile.height || 170),
      bmi: Number(profile.bmi || 22),
      weightCategory: String(profile.weightCategory || "healthy"),
      dailyCalorieTarget: Number(plan?.caloriesTarget || 2000),
      dailyProteinTarget: Number(plan?.proteinTarget || 120),
      dailyWaterTargetMl: 2500,
    },
    dayContext: {
      caloriesConsumed: Number(plan?.caloriesConsumed || 0),
      proteinConsumed: Number(plan?.proteinConsumed || 0),
      waterConsumedMl: Number(plan?.waterIntake || 0),
      streakDays: Number(gamification?.currentStreak || 0),
      cheatMealsThisWeek: 0,
      todaysMeals: plan?.meals?.map((meal) => meal.name) || [],
      todaysWorkout: plan?.workouts?.[0]?.name,
      lastWeightKg: currentWeight,
      weightTrend,
    },
  };
};

router.get("/messages", isAuthenticated, async (req: any, res) => {
  try {
    const conversation = await storage.getCoachConversation(req.user.id);
    const messages = await storage.getConversationMessages(conversation.id);
    res.json(messages);
  } catch (error) {
    console.error("[COACH_ROUTER] Failed to load messages:", error);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

const handleCoachMessage = async (req: any, res: any) => {
  try {
    const { message, contextType, conversationHistory } = messageSchema.parse(req.body);
    const userId = req.user.id;
    const { profile, dayContext } = await buildUserContext(userId);
    const conversation = await storage.getCoachConversation(userId);

    await storage.createMessage({
      conversationId: conversation.id,
      role: "user",
      content: message,
    });

    const reply = await askAARA({
      message,
      profile,
      dayContext,
      conversationHistory,
      contextType,
    });

    await storage.createMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: reply,
    });

    return res.json({ response: reply, content: reply, done: true, fullResponse: reply });
  } catch (error: any) {
    console.error("[COACH_ROUTER] Coach error:", error);
    return res.status(500).json({
      error: "Coach temporarily unavailable",
      message: process.env.NODE_ENV === "development" ? error.message : "Coach temporarily unavailable",
    });
  }
};

router.post("/message", isAuthenticated, handleCoachMessage);
router.post("/chat", isAuthenticated, handleCoachMessage);

router.post("/ingredients", isAuthenticated, async (req: any, res) => {
  try {
    const { ingredients, cookingMethod, remainingCalories, remainingProtein } = ingredientSchema.parse(req.body);
    const { profile } = await buildUserContext(req.user.id);
    const suggestion = await suggestFromIngredients({
      ingredients,
      cookingMethod,
      remainingCalories,
      remainingProtein,
      profile,
    });
    res.json(suggestion);
  } catch (error) {
    console.error("[COACH_ROUTER] Ingredient suggestion error:", error);
    res.status(500).json({ error: "Could not generate suggestion" });
  }
});

export default router;

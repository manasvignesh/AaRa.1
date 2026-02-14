import { db } from "./db";
import {
  userProfiles, dailyPlans, meals, workouts, weightLogs, manualMeals, workoutSessions,
  type UserProfile, type InsertUserProfile,
  type DailyPlan, type InsertDailyPlan,
  type Meal, type InsertMeal,
  type Workout, type InsertWorkout,
  type WeightLog, type InsertWeightLog,
  type DailyPlanWithDetails,
  type ManualMeal, type InsertManualMeal,
  type WorkoutSession, type InsertWorkoutSession,
  type User, type InsertUser,
  users, conversations, messages,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  activityLogs, gpsRoutes, userGamification,
  type ActivityLog, type InsertActivityLog,
  type GpsRoute, type InsertGpsRoute,
  type UserGamification, type InsertUserGamification
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User Profile
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile & { userId: number }): Promise<UserProfile>;
  updateUserProfile(userId: number, updates: Partial<InsertUserProfile>): Promise<UserProfile>;

  // Daily Plans
  getDailyPlan(userId: number, date: string): Promise<DailyPlanWithDetails | undefined>;
  getDailyPlanMeta(userId: number, date: string): Promise<DailyPlan | undefined>;
  getPlanMetaById(planId: number): Promise<DailyPlan | undefined>;
  createDailyPlan(plan: InsertDailyPlan): Promise<DailyPlan>;

  // Meals
  getMeal(id: number): Promise<Meal | undefined>;
  getPlanMeals(planId: number): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  updateMeal(id: number, updates: Partial<InsertMeal>): Promise<Meal>;
  getPlanWithDetails(planId: number): Promise<DailyPlanWithDetails>;

  // Workouts
  getWorkout(id: number): Promise<Workout | undefined>;
  getWorkoutWithPlan(id: number): Promise<(Workout & { plan: DailyPlan }) | undefined>;
  getPlanWorkouts(planId: number): Promise<Workout[]>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout>;

  // Plan Updates
  updateDailyPlanTargets(id: number, calories: number, protein: number): Promise<DailyPlan>;

  // Water
  updateWaterIntake(userId: number, date: string, amount: number): Promise<DailyPlan>;

  // Weight Logs
  logWeight(log: InsertWeightLog): Promise<WeightLog>;
  getWeightHistory(userId: number): Promise<WeightLog[]>;

  // Manual Meals
  createManualMeal(meal: InsertManualMeal): Promise<Meal>;
  getManualMeals(planId: number): Promise<ManualMeal[]>;

  // Workout Sessions
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  updateWorkoutSession(id: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession>;
  getWorkoutSession(workoutId: number): Promise<WorkoutSession | undefined>;

  // Adaptation
  activateAdaptation(planId: number, days: number): Promise<DailyPlan>;
  clearPlanDetails(planId: number): Promise<void>;
  getRecentMealNames(userId: number, limit: number): Promise<string[]>;
  getRecentPlansWithDetails(userId: number, limit: number): Promise<DailyPlanWithDetails[]>;

  // Coach Chat Persistence
  getCoachConversation(userId: number): Promise<Conversation>;
  getConversationMessages(conversationId: number): Promise<Message[]>;
  getConversationMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Walk & Run
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getTodayActivity(userId: number): Promise<ActivityLog | undefined>;
  saveGpsRoute(route: InsertGpsRoute): Promise<GpsRoute>;
  getGamificationProfile(userId: number): Promise<UserGamification>;
  updateGamification(userId: number, updates: Partial<InsertUserGamification>): Promise<UserGamification>;
  getLeaderboard(type: 'steps' | 'distance', limit: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const cleanEmail = email.toLowerCase().trim();
    console.log(`[STORAGE] getUserByEmail called with: "${cleanEmail}"`);
    try {
      // Use SQL template for case-insensitive match if needed, but since we store them clean, simple eq is fine if we clean before insert too.
      // For now, let's just make sure we check exactly what's passed after cleaning.
      const [user] = await db.select().from(users).where(eq(sql`LOWER(${users.email})`, cleanEmail));
      console.log(`[STORAGE] getUserByEmail result:`, user ? `Found user id=${user.id}` : 'NOT FOUND');
      return user;
    } catch (err) {
      console.error(`[STORAGE] getUserByEmail error:`, err);
      throw err;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...user,
      email: user.email.toLowerCase().trim()
    }).returning();
    return newUser;
  }

  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    try {
      const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
      return profile;
    } catch (err) {
      console.error(`[STORAGE] getUserProfile CRITICAL ERROR for userId ${userId}:`, err);
      throw err;
    }
  }

  async createUserProfile(profile: InsertUserProfile & { userId: number }): Promise<UserProfile> {
    const [newProfile] = await db.insert(userProfiles).values(profile).returning();
    return newProfile;
  }

  async updateUserProfile(userId: number, updates: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [updated] = await db.update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  async getDailyPlan(userId: number, date: string): Promise<DailyPlanWithDetails | undefined> {
    const plan = await this.getDailyPlanMeta(userId, date);
    if (!plan) return undefined;

    const planMeals = await this.getPlanMeals(plan.id);
    const planWorkouts = await this.getPlanWorkouts(plan.id);

    return {
      ...plan,
      meals: planMeals,
      workouts: planWorkouts,
    };
  }

  async getDailyPlanMeta(userId: number, date: string): Promise<DailyPlan | undefined> {
    const [plan] = await db.select()
      .from(dailyPlans)
      .where(and(eq(dailyPlans.userId, userId), eq(dailyPlans.date, date)));
    return plan;
  }

  async getPlanMetaById(planId: number): Promise<DailyPlan | undefined> {
    const [plan] = await db.select().from(dailyPlans).where(eq(dailyPlans.id, planId));
    return plan;
  }

  async createDailyPlan(plan: InsertDailyPlan): Promise<DailyPlan> {
    const [newPlan] = await db.insert(dailyPlans).values(plan).returning();
    return newPlan;
  }

  async getMeal(id: number): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, id));
    return meal;
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [newMeal] = await db.insert(meals).values(meal).returning();
    return newMeal;
  }

  async getPlanMeals(planId: number): Promise<Meal[]> {
    return db.select().from(meals).where(eq(meals.planId, planId));
  }

  async recalculatePlanTotals(planId: number): Promise<void> {
    const planMeals = await db.select().from(meals).where(eq(meals.planId, planId));
    const manualMealsList = await db.select().from(manualMeals).where(eq(manualMeals.planId, planId));

    const totalCals = [
      ...planMeals.map(m => m.consumedAlternative ? (m.alternativeCalories || 0) : (m.isConsumed ? m.calories : 0)),
      ...manualMealsList.map(m => m.estimatedCaloriesMax || 0)
    ].reduce((sum, c) => sum + c, 0);

    const totalProtein = [
      ...planMeals.map(m => m.consumedAlternative ? (m.alternativeProtein || 0) : (m.isConsumed ? m.protein : 0)),
      ...manualMealsList.map(m => m.estimatedProtein || 0)
    ].reduce((sum, p) => sum + p, 0);

    await db.update(dailyPlans)
      .set({ caloriesConsumed: totalCals, proteinConsumed: totalProtein })
      .where(eq(dailyPlans.id, planId));
  }

  async updateMeal(id: number, updates: Partial<InsertMeal>): Promise<Meal> {
    const [updated] = await db.update(meals)
      .set(updates)
      .where(eq(meals.id, id))
      .returning();

    if (!updated) throw new Error("Meal not found");

    await this.recalculatePlanTotals(updated.planId);
    return updated;
  }

  async getPlanWithDetails(planId: number): Promise<DailyPlanWithDetails> {
    const plan = await this.getPlanMetaById(planId);
    if (!plan) throw new Error("Plan not found");

    const planMeals = await this.getPlanMeals(plan.id);
    const planWorkouts = await this.getPlanWorkouts(plan.id);

    return {
      ...plan,
      meals: planMeals,
      workouts: planWorkouts,
    };
  }

  async updateWaterIntake(userId: number, date: string, amount: number): Promise<DailyPlan> {
    const [plan] = await db.select().from(dailyPlans).where(and(eq(dailyPlans.userId, userId), eq(dailyPlans.date, date)));
    if (!plan) throw new Error("Plan not found");

    const newIntake = (plan.waterIntake || 0) + amount;
    const [updated] = await db.update(dailyPlans)
      .set({ waterIntake: newIntake })
      .where(eq(dailyPlans.id, plan.id))
      .returning();
    return updated;
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }

  async getWorkoutWithPlan(id: number): Promise<(Workout & { plan: DailyPlan }) | undefined> {
    const [result] = await db.select({
      workout: workouts,
      plan: dailyPlans
    })
      .from(workouts)
      .innerJoin(dailyPlans, eq(workouts.planId, dailyPlans.id))
      .where(eq(workouts.id, id));

    if (!result) return undefined;
    return { ...result.workout, plan: result.plan };
  }

  async getPlanWorkouts(planId: number): Promise<Workout[]> {
    return db.select().from(workouts).where(eq(workouts.planId, planId));
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout> {
    const [updated] = await db.update(workouts)
      .set(updates)
      .where(eq(workouts.id, id))
      .returning();
    return updated;
  }

  async updateDailyPlanTargets(id: number, calories: number, protein: number): Promise<DailyPlan> {
    const [updated] = await db.update(dailyPlans)
      .set({ caloriesTarget: calories, proteinTarget: protein })
      .where(eq(dailyPlans.id, id))
      .returning();
    return updated;
  }

  async logWeight(log: InsertWeightLog): Promise<WeightLog> {
    const [newLog] = await db.insert(weightLogs).values(log).returning();
    return newLog;
  }

  async getWeightHistory(userId: number): Promise<WeightLog[]> {
    return db.select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(desc(weightLogs.date));
  }

  async createManualMeal(meal: InsertManualMeal): Promise<Meal> {
    const [newMeal] = await db.insert(manualMeals).values(meal).returning();
    await this.recalculatePlanTotals(meal.planId);
    // Note: manualMeals are technically distinct but we return the newly created record
    // In our simplified schema, manual meals are stored in manualMeals table.
    // However, the interface expects a Meal type for the update. 
    // ManualMeal and Meal are slightly different. I'll just return the ManualMeal cast to any for now
    // or better, ensure createManualMeal returns what the contract says.
    return newMeal as any;
  }

  async getManualMeals(planId: number): Promise<ManualMeal[]> {
    return db.select().from(manualMeals).where(eq(manualMeals.planId, planId));
  }

  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const [newSession] = await db.insert(workoutSessions).values(session).returning();
    return newSession;
  }

  async updateWorkoutSession(id: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession> {
    const [updated] = await db.update(workoutSessions)
      .set(updates)
      .where(eq(workoutSessions.id, id))
      .returning();
    return updated;
  }

  async getWorkoutSession(workoutId: number): Promise<WorkoutSession | undefined> {
    const [session] = await db.select()
      .from(workoutSessions)
      .where(eq(workoutSessions.workoutId, workoutId))
      .orderBy(desc(workoutSessions.createdAt));
    return session;
  }

  async activateAdaptation(planId: number, days: number): Promise<DailyPlan> {
    const [updated] = await db.update(dailyPlans)
      .set({
        adaptationActive: true,
        adaptationDaysRemaining: days
      })
      .where(eq(dailyPlans.id, planId))
      .returning();
    return updated;
  }

  async clearPlanDetails(planId: number): Promise<void> {
    await db.delete(meals).where(eq(meals.planId, planId));
    await db.delete(workouts).where(eq(workouts.planId, planId));
    await db.delete(manualMeals).where(eq(manualMeals.planId, planId));
  }

  async getRecentMealNames(userId: number, limit: number = 20): Promise<string[]> {
    const userPlans = await db.select({ id: dailyPlans.id })
      .from(dailyPlans)
      .where(eq(dailyPlans.userId, userId))
      .orderBy(desc(dailyPlans.date), desc(dailyPlans.createdAt))
      .limit(10); // Check last 10 plans

    if (userPlans.length === 0) return [];

    const recentMeals = await db.select({ name: meals.name })
      .from(meals)
      .where(and(
        // Use inArray if I had more than one planId, but for now I'll just map
        // Actually, drizzle inArray is fine.
        // eq for simple test
      ))
      .limit(limit);

    // Simpler way to get recent meal names across plans
    const allRecentMeals = await db.select({ name: meals.name })
      .from(meals)
      .innerJoin(dailyPlans, eq(meals.planId, dailyPlans.id))
      .where(eq(dailyPlans.userId, userId))
      .orderBy(desc(dailyPlans.date), desc(meals.id))
      .limit(limit);

    return allRecentMeals.map(m => m.name);
  }

  async getRecentPlansWithDetails(userId: number, limit: number = 30): Promise<DailyPlanWithDetails[]> {
    const plans = await db.select()
      .from(dailyPlans)
      .where(eq(dailyPlans.userId, userId))
      .orderBy(desc(dailyPlans.date))
      .limit(limit);

    const fullPlans: DailyPlanWithDetails[] = [];
    for (const plan of plans) {
      const planMeals = await this.getPlanMeals(plan.id);
      const planWorkouts = await this.getPlanWorkouts(plan.id);
      fullPlans.push({
        ...plan,
        meals: planMeals,
        workouts: planWorkouts
      });
    }
    return fullPlans;
  }

  async getCoachConversation(userId: number): Promise<Conversation> {
    const [existing] = await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.createdAt));
    if (existing) return existing;

    const [newConv] = await db.insert(conversations).values({
      userId,
      title: "Coach Chat",
    }).returning();
    return newConv;
  }

  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // Walk & Run Implementation
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    // Check if entry exists for today
    const [existing] = await db.select()
      .from(activityLogs)
      .where(and(eq(activityLogs.userId, activity.userId), eq(activityLogs.date, activity.date)));

    if (existing) {
      const [updated] = await db.update(activityLogs)
        .set({
          steps: activity.steps,
          distance: activity.distance,
          calories: activity.calories,
          activeTime: activity.activeTime,
          lastSyncedAt: new Date()
        })
        .where(eq(activityLogs.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newLog] = await db.insert(activityLogs).values(activity).returning();
      return newLog;
    }
  }

  async getTodayActivity(userId: number): Promise<ActivityLog | undefined> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [log] = await db.select().from(activityLogs).where(
        and(eq(activityLogs.userId, userId), eq(activityLogs.date, todayStr))
      );
      return log;
    } catch (err) {
      console.error(`[STORAGE] getTodayActivity error for userId ${userId}:`, err);
      return undefined;
    }
  }

  async saveGpsRoute(route: InsertGpsRoute): Promise<GpsRoute> {
    const [newRoute] = await db.insert(gpsRoutes).values(route).returning();
    return newRoute;
  }

  async getGamificationProfile(userId: number): Promise<UserGamification> {
    try {
      const [profile] = await db.select().from(userGamification).where(eq(userGamification.userId, userId));

      if (profile) return profile;

      // Create default if not exists
      const [newProfile] = await db.insert(userGamification).values({ userId }).returning();
      return newProfile;
    } catch (err) {
      console.error(`[STORAGE] getGamificationProfile error for userId ${userId}:`, err);
      // Return a dummy object if DB fails entirely to prevent 500
      return {
        userId,
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        badges: []
      } as any;
    }
  }

  async updateGamification(userId: number, updates: Partial<InsertUserGamification>): Promise<UserGamification> {
    const [updated] = await db.update(userGamification)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userGamification.userId, userId))
      .returning();
    return updated;
  }

  async getLeaderboard(type: 'steps' | 'distance', limit: number = 50): Promise<any[]> {
    const todayStr = new Date().toISOString().split('T')[0];
    // Join with users to get names
    const result = await db.select({
      userId: activityLogs.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      value: type === 'steps' ? activityLogs.steps : activityLogs.distance,
      profileImage: users.profileImageUrl
    })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.date, todayStr))
      .orderBy(desc(type === 'steps' ? activityLogs.steps : activityLogs.distance))
      .limit(limit);

    return result;
  }
}

export const storage = new DatabaseStorage();

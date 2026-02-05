import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

export * from "./models/auth";
export * from "./models/chat";

// === TABLE DEFINITIONS ===

// User Profile (Health Data)
// We link this to the Auth user via userId (which is text/uuid from Replit Auth)
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(), // Links to users.id
  age: integer("age").notNull(),
  gender: text("gender").notNull(), // 'male', 'female', 'other'
  height: integer("height").notNull(), // in cm
  currentWeight: integer("current_weight").notNull(), // in kg
  targetWeight: integer("target_weight").notNull(), // in kg - strictly fat loss
  dailyMealCount: integer("daily_meal_count").default(3), // Fixed for the day
  activityLevel: text("activity_level").notNull(), // 'sedentary', 'moderate', 'active'
  dietaryPreferences: text("dietary_preferences").notNull(), // 'veg', 'non-veg', 'egg'
  cookingAccess: text("cooking_access").notNull(), // 'full', 'basic', 'none'
  timeAvailability: integer("time_availability").notNull(), // minutes per day
  gymAccess: boolean("gym_access").default(false),
  displayName: text("display_name"),
  royalRole: text("royal_role"),
  // Mature health metrics
  sleepDuration: integer("sleep_duration").default(8), // hours
  stressLevel: text("stress_level").default("moderate"), // 'low', 'moderate', 'high'
  primaryGoal: text("primary_goal").default("fat_loss"), // 'fat_loss', 'recomposition', 'muscle_gain'
  weeklyGoalPace: text("weekly_goal_pace").default("balanced"), // 'slow', 'balanced', 'aggressive'
  // Preferences
  coachingTone: text("coaching_tone").default("supportive"), // 'supportive', 'direct', 'neutral'
  reminderFrequency: text("reminder_frequency").default("normal"), // 'low', 'normal', 'high'
  units: text("units").default("kg"), // 'kg', 'lbs'
  theme: text("theme").default("system"), // 'light', 'dark', 'system'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Plans
export const dailyPlans = pgTable("daily_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  caloriesTarget: integer("calories_target").notNull(),
  proteinTarget: integer("protein_target").notNull(), // in grams
  caloriesConsumed: integer("calories_consumed").default(0),
  proteinConsumed: integer("protein_consumed").default(0),
  waterIntake: integer("water_intake").default(0), // in glasses/ml
  adaptationActive: boolean("adaptation_active").default(false), // gentle adaptation in progress
  adaptationDaysRemaining: integer("adaptation_days_remaining").default(0),
  status: text("status").default("active"), // 'active', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Meals
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  type: text("type").notNull(), // 'breakfast', 'lunch', 'dinner', 'snack'
  name: text("name").notNull(),
  description: text("description"),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs"),
  fats: integer("fats"),
  ingredients: jsonb("ingredients").$type<string[]>(), // List of ingredients
  instructions: text("instructions"),
  isConsumed: boolean("is_consumed").default(false),
  consumedAt: timestamp("consumed_at"),
  feedback: text("feedback"), // User feedback
  // Alternative meal tracking (when user ate something else)
  alternativeDescription: text("alternative_description"),
  alternativeCalories: integer("alternative_calories"),
  alternativeProtein: integer("alternative_protein"),
  consumedAlternative: boolean("consumed_alternative").default(false),
});

// Workouts
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  type: text("type").notNull(), // 'cardio', 'strength', 'yoga'
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // minutes
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  exercises: jsonb("exercises").$type<any[]>(), // List of exercises
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  feedback: text("feedback"),
});

// Weight Logs
export const weightLogs = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weight: integer("weight").notNull(), // in kg
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manual Meals (outside plan / cheat meals)
export const manualMeals = pgTable("manual_meals", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  description: text("description").notNull(),
  portionSize: text("portion_size").notNull(), // 'small', 'medium', 'large'
  mealType: text("meal_type").notNull(), // 'snack', 'meal'
  estimatedCaloriesMin: integer("estimated_calories_min"),
  estimatedCaloriesMax: integer("estimated_calories_max"),
  estimatedProtein: integer("estimated_protein"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workout Sessions (active workout tracking)
export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'partial'
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalDuration: integer("total_duration"), // actual seconds completed
  currentPhase: text("current_phase"), // 'warmup', 'main', 'cooldown'
  currentExerciseIndex: integer("current_exercise_index").default(0),
  pausedAt: timestamp("paused_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === WALK & RUN FEATURE TABLES ===

// Activity Logs (Passive Tracking)
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  steps: integer("steps").default(0),
  distance: integer("distance").default(0), // in meters
  calories: integer("calories").default(0),
  activeTime: integer("active_time").default(0), // in minutes
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
});

// GPS Routes
export const gpsRoutes = pgTable("gps_routes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  distance: integer("distance").default(0), // in meters
  duration: integer("duration").default(0), // in seconds
  routePoints: jsonb("route_points").$type<{ lat: number; lng: number; timestamp: number }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gamification Profile
export const userGamification = pgTable("user_gamification", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  xp: integer("xp").default(0),
  level: integer("level").default(1),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActiveDate: date("last_active_date"),
  badges: jsonb("badges").$type<string[]>(), // Array of badge IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === RELATIONS ===
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  plans: many(dailyPlans),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const dailyPlansRelations = relations(dailyPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [dailyPlans.userId],
    references: [users.id],
  }),
  meals: many(meals),
  workouts: many(workouts),
}));

export const mealsRelations = relations(meals, ({ one }) => ({
  plan: one(dailyPlans, {
    fields: [meals.planId],
    references: [dailyPlans.id],
  }),
}));

export const workoutsRelations = relations(workouts, ({ one }) => ({
  plan: one(dailyPlans, {
    fields: [workouts.planId],
    references: [dailyPlans.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const gpsRoutesRelations = relations(gpsRoutes, ({ one }) => ({
  user: one(users, {
    fields: [gpsRoutes.userId],
    references: [users.id],
  }),
}));

export const userGamificationRelations = relations(userGamification, ({ one }) => ({
  user: one(users, {
    fields: [userGamification.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDailyPlanSchema = createInsertSchema(dailyPlans).omit({
  id: true,
  createdAt: true
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true
});

export const insertWeightLogSchema = createInsertSchema(weightLogs).omit({
  id: true,
  createdAt: true
});

export const insertManualMealSchema = createInsertSchema(manualMeals).omit({
  id: true,
  createdAt: true
});

export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({
  id: true,
  createdAt: true
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  lastSyncedAt: true
});

export const insertGpsRouteSchema = createInsertSchema(gpsRoutes).omit({
  id: true,
  createdAt: true
});

export const insertUserGamificationSchema = createInsertSchema(userGamification).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type DailyPlan = typeof dailyPlans.$inferSelect;
export type InsertDailyPlan = z.infer<typeof insertDailyPlanSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

export type WeightLog = typeof weightLogs.$inferSelect;
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;

export type ManualMeal = typeof manualMeals.$inferSelect;
export type InsertManualMeal = z.infer<typeof insertManualMealSchema>;

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type GpsRoute = typeof gpsRoutes.$inferSelect;
export type InsertGpsRoute = z.infer<typeof insertGpsRouteSchema>;

export type UserGamification = typeof userGamification.$inferSelect;
export type InsertUserGamification = z.infer<typeof insertUserGamificationSchema>;

// Structured Exercise Type for timer-based workouts
export type StructuredExercise = {
  name: string;
  duration: number; // seconds
  instruction: string;
  phase: 'warmup' | 'main' | 'cooldown';
};

export type StructuredWorkout = {
  warmup: StructuredExercise[];
  main: StructuredExercise[];
  cooldown: StructuredExercise[];
  restDuration: number; // default rest between exercises in seconds
};

// Complex Response Types
export type DailyPlanWithDetails = DailyPlan & {
  meals: Meal[];
  workouts: Workout[];
};

export type GeneratePlanRequest = {
  date: string; // YYYY-MM-DD
  preferences?: {
    mealCount?: number;
    includeWorkout?: boolean;
  };
};

export type LogMealRequest = {
  consumed: boolean;
};

export type LogWorkoutRequest = {
  completed: boolean;
  feedback?: string;
};

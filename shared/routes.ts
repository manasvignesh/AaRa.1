import { z } from 'zod';
import {
  insertUserProfileSchema,
  insertWeightLogSchema,
  userProfiles,
  dailyPlans,
  meals,
  workouts,
  weightLogs,
  manualMeals,
  workoutSessions
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  user: {
    getProfile: {
      method: 'GET' as const,
      path: '/api/user/profile',
      responses: {
        200: z.custom<typeof userProfiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    createProfile: {
      method: 'POST' as const,
      path: '/api/user/profile',
      input: insertUserProfileSchema.omit({ userId: true }), // UserId comes from auth
      responses: {
        201: z.custom<typeof userProfiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateProfile: {
      method: 'PATCH' as const,
      path: '/api/user/profile',
      input: insertUserProfileSchema.omit({ userId: true }).partial(),
      responses: {
        200: z.custom<typeof userProfiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    getStats: {
      method: 'GET' as const,
      path: '/api/user/stats',
      responses: {
        200: z.object({
          currentWeight: z.number(),
          weightChange: z.number(),
          caloriesConsistency: z.number(),
          proteinConsistency: z.number(),
          workoutConsistency: z.number(),
          currentStreak: z.number(),
          bestStreak: z.number(),
        }),
      },
    },
  },
  plans: {
    getDaily: {
      method: 'GET' as const,
      path: '/api/plans/daily/:date', // YYYY-MM-DD
      responses: {
        200: z.custom<typeof dailyPlans.$inferSelect & { meals: typeof meals.$inferSelect[], workouts: typeof workouts.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    getMeta: {
      method: 'GET' as const,
      path: '/api/plans/:date/meta',
      responses: {
        200: z.custom<typeof dailyPlans.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    getMeals: {
      method: 'GET' as const,
      path: '/api/plans/:date/meals',
      responses: {
        200: z.array(z.custom<typeof meals.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
    getWorkouts: {
      method: 'GET' as const,
      path: '/api/plans/:date/workouts',
      responses: {
        200: z.array(z.custom<typeof workouts.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
    updateWater: {
      method: 'PATCH' as const,
      path: '/api/plans/water',
      input: z.object({ date: z.string(), amount: z.number() }),
      responses: {
        200: z.custom<typeof dailyPlans.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/plans/generate',
      input: z.object({
        date: z.string(),
      }),
      responses: {
        201: z.custom<typeof dailyPlans.$inferSelect & { meals: typeof meals.$inferSelect[], workouts: typeof workouts.$inferSelect[] }>(),
        400: errorSchemas.validation,
      },
    },
  },
  meals: {
    toggleConsumed: {
      method: 'PATCH' as const,
      path: '/api/meals/:id/consume',
      input: z.object({ isConsumed: z.boolean() }),
      responses: {
        200: z.custom<typeof meals.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    logAlternative: {
      method: 'POST' as const,
      path: '/api/meals/:id/alternative',
      input: z.object({
        description: z.string(),
        portionSize: z.enum(['small', 'medium', 'large']),
      }),
      responses: {
        200: z.custom<typeof meals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    regenerate: {
      method: 'POST' as const,
      path: '/api/meals/:id/regenerate',
      input: z.object({
        reason: z.string(),
        availableIngredients: z.array(z.string()).optional(),
      }),
      responses: {
        200: z.custom<typeof meals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  workouts: {
    complete: {
      method: 'PATCH' as const,
      path: '/api/workouts/:id/complete',
      input: z.object({ isCompleted: z.boolean(), feedback: z.string().optional() }),
      responses: {
        200: z.custom<typeof workouts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    startSession: {
      method: 'POST' as const,
      path: '/api/workouts/:id/start',
      responses: {
        201: z.custom<typeof workoutSessions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/workouts/:id',
      responses: {
        200: z.custom<any>(), // Will be Workout & { plan: DailyPlan }
        404: errorSchemas.notFound,
      },
    },
    updateSession: {
      method: 'PATCH' as const,
      path: '/api/workout-sessions/:id',
      input: z.object({
        status: z.string().optional(),
        currentPhase: z.string().optional(),
        currentExerciseIndex: z.number().optional(),
        totalDuration: z.number().optional(),
      }),
      responses: {
        200: z.custom<typeof workoutSessions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  manualMeals: {
    log: {
      method: 'POST' as const,
      path: '/api/manual-meals',
      input: z.object({
        planId: z.number(),
        description: z.string(),
        portionSize: z.enum(['small', 'medium', 'large']),
        mealType: z.enum(['snack', 'meal']),
      }),
      responses: {
        201: z.custom<typeof meals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  weight: {
    log: {
      method: 'POST' as const,
      path: '/api/weight',
      input: z.object({ weight: z.number(), date: z.string() }),
      responses: {
        201: z.custom<typeof weightLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    getHistory: {
      method: 'GET' as const,
      path: '/api/weight/history',
      responses: {
        200: z.array(z.custom<typeof weightLogs.$inferSelect>()),
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

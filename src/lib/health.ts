import { apiRequest, queryClient } from "./queryClient";
import { InsertActivityLog, InsertGpsRoute } from "@shared/schema";

export interface ActivityStats {
    steps: number;
    distance: number; // meters
    calories: number;
    activeTime: number; // minutes
}

type HealthUpdateListener = (stats: ActivityStats) => void;
type GpsUpdateListener = (position: GeolocationPosition) => void;

class HealthService {
    private static instance: HealthService;

    // State
    private stats: ActivityStats = {
        steps: 0,
        distance: 0,
        calories: 0,
        activeTime: 0
    };

    private isTracking = false;
    private isGpsEnabled = false;
    private isStepCounterEnabled = false;

    // GPS
    private watchId: number | null = null;
    private pendingRoutePoints: { lat: number; lng: number; timestamp: number }[] = [];
    private routeStartTime: Date | null = null;
    private lastPosition: { lat: number; lng: number; timestamp: number } | null = null;

    // Constants
    private readonly MIN_DISTANCE_THRESHOLD = 5; // meters
    private readonly AVG_STRIDE_LENGTH = 0.762; // meters per step
    private readonly CALORIES_PER_STEP = 0.04; // kcal

    // Motion step counter (works while app is open; avoids hard native dependencies)
    private motionHandler: ((e: DeviceMotionEvent) => void) | null = null;
    private lastStepAtMs = 0;
    private stepArmed = true;
    private readonly STEP_DEBOUNCE_MS = 260;
    private readonly STEP_ARM_THRESHOLD = 1.0; // m/s^2 (below this re-arms)
    private readonly STEP_TRIGGER_THRESHOLD = 2.0; // m/s^2 (above this counts a step)

    // Listeners
    private listeners: HealthUpdateListener[] = [];
    private gpsListeners: GpsUpdateListener[] = [];

    private constructor() {
        this.loadInitialStats();
    }

    public static getInstance(): HealthService {
        if (!HealthService.instance) {
            HealthService.instance = new HealthService();
        }
        return HealthService.instance;
    }

    private async loadInitialStats() {
        try {
            const res = await apiRequest("GET", "/api/activity/today");
            const data = await res.json();
            if (data.activity) {
                this.stats = {
                    steps: data.activity.steps || 0,
                    distance: data.activity.distance || 0,
                    calories: data.activity.calories || 0,
                    activeTime: data.activity.activeTime || 0
                };
                this.notifyListeners();
            }
        } catch (err) {
            console.error("Failed to load initial stats", err);
        }
    }

    public subscribe(listener: HealthUpdateListener) {
        this.listeners.push(listener);
        listener(this.stats); // Initial callback
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public subscribeGps(listener: GpsUpdateListener) {
        this.gpsListeners.push(listener);
        return () => {
            this.gpsListeners = this.gpsListeners.filter(l => l !== listener);
        };
    }

    // Removed Random Simulation - Strict GPS Only

    public async enableStepCounter() {
        if (this.isStepCounterEnabled) return;
        if (typeof window === "undefined") return;
        if (typeof (window as any).DeviceMotionEvent === "undefined") return;

        // iOS requires a user gesture to call requestPermission(). If this throws, keep disabled.
        try {
            const DME: any = (window as any).DeviceMotionEvent;
            if (typeof DME?.requestPermission === "function") {
                const result = await DME.requestPermission();
                if (result !== "granted") return;
            }
        } catch {
            return;
        }

        this.isStepCounterEnabled = true;
        this.isTracking = true;

        this.lastStepAtMs = 0;
        this.stepArmed = true;

        this.motionHandler = (e: DeviceMotionEvent) => {
            const acc = e.accelerationIncludingGravity;
            if (!acc) return;

            const ax = acc.x ?? 0;
            const ay = acc.y ?? 0;
            const az = acc.z ?? 0;
            const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

            // Approximate dynamic acceleration by removing gravity.
            const dynamic = Math.abs(magnitude - 9.81);

            if (dynamic < this.STEP_ARM_THRESHOLD) {
                this.stepArmed = true;
                return;
            }

            const now = typeof e.timeStamp === "number" ? e.timeStamp : Date.now();
            if (this.stepArmed && dynamic >= this.STEP_TRIGGER_THRESHOLD && now - this.lastStepAtMs >= this.STEP_DEBOUNCE_MS) {
                this.stepArmed = false;
                this.lastStepAtMs = now;

                this.stats.steps += 1;
                this.stats.distance += this.AVG_STRIDE_LENGTH;
                this.stats.calories += this.CALORIES_PER_STEP;
                this.notifyListeners();
            }
        };

        window.addEventListener("devicemotion", this.motionHandler, { passive: true });
    }

    public disableStepCounter() {
        if (!this.isStepCounterEnabled) return;
        if (typeof window === "undefined") return;

        if (this.motionHandler) {
            window.removeEventListener("devicemotion", this.motionHandler as any);
        }

        this.motionHandler = null;
        this.isStepCounterEnabled = false;
        this.isTracking = this.isGpsEnabled;

        this.sync();
    }

    public enableGps() {
        if (!navigator.geolocation) {
            console.error("Geolocation not supported");
            return;
        }

        this.isGpsEnabled = true;
        this.isTracking = true;
        // Avoid double-counting: GPS-derived steps while GPS is enabled.
        this.disableStepCounter();
        this.routeStartTime = new Date();
        this.pendingRoutePoints = [];
        this.lastPosition = null;

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                // Strict Accuracy Filter (ignore points with > 30m error)
                if (position.coords.accuracy > 30) {
                    // Notify listener but don't count distance yet? 
                    // Or just pass it on and let UI decide to show "Weak Signal"
                    this.gpsListeners.forEach(l => l(position));
                    return;
                }

                // Calculate Delta
                const currentLat = position.coords.latitude;
                const currentLng = position.coords.longitude;

                if (this.lastPosition) {
                    const distDelta = this.haversineDistance(
                        this.lastPosition.lat, this.lastPosition.lng,
                        currentLat, currentLng
                    );

                    // THRESHOLD: Only count if moved > 5 meters
                    if (distDelta >= this.MIN_DISTANCE_THRESHOLD) {
                        this.stats.distance += distDelta;

                        // Derived Steps
                        const stepsDelta = Math.floor(distDelta / this.AVG_STRIDE_LENGTH);
                        this.stats.steps += stepsDelta;
                        this.stats.calories += stepsDelta * this.CALORIES_PER_STEP;

                        // Active Time (diff from last timestamp)
                        const timeDelta = (position.timestamp - this.lastPosition.timestamp) / 1000 / 60; // minutes
                        if (timeDelta > 0 && timeDelta < 5) { // Only add if reasonable gap (<5 min)
                            this.stats.activeTime += timeDelta;
                        }

                        // Update Last Valid Position
                        this.lastPosition = {
                            lat: currentLat,
                            lng: currentLng,
                            timestamp: position.timestamp
                        };

                        // Add to route path
                        this.pendingRoutePoints.push({
                            lat: currentLat,
                            lng: currentLng,
                            timestamp: position.timestamp
                        });

                        this.notifyListeners();
                    }
                } else {
                    // First valid point
                    this.lastPosition = {
                        lat: currentLat,
                        lng: currentLng,
                        timestamp: position.timestamp
                    };
                    this.pendingRoutePoints.push({
                        lat: currentLat,
                        lng: currentLng,
                        timestamp: position.timestamp
                    });
                }

                this.gpsListeners.forEach(l => l(position));
            },
            (err) => console.error("GPS Error", err),
            { enableHighAccuracy: true, maximumAge: 0 }
        );
    }

    public disableGps() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.isGpsEnabled = false;
        this.isTracking = this.isStepCounterEnabled;

        // Save Route
        if (this.pendingRoutePoints.length > 2) {
            this.saveRoute();
        }

        // Final Sync
        this.sync();
    }

    private async saveRoute() {
        if (!this.routeStartTime) return;

        const payload: Omit<InsertGpsRoute, 'userId' | 'id' | 'createdAt'> = {
            startTime: this.routeStartTime,
            endTime: new Date(),
            distance: Math.floor(this.stats.distance),
            routePoints: this.pendingRoutePoints,
            duration: Math.floor((new Date().getTime() - this.routeStartTime.getTime()) / 1000)
        };

        try {
            await apiRequest("POST", "/api/routes", payload);
            this.pendingRoutePoints = [];
        } catch (err) {
            console.error("Failed to save route", err);
        }
    }

    public async sync() {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const payload: Omit<InsertActivityLog, 'userId' | 'id' | 'lastSyncedAt'> = {
                date: todayStr,
                steps: Math.floor(this.stats.steps),
                distance: Math.floor(this.stats.distance),
                calories: Math.floor(this.stats.calories),
                activeTime: Math.floor(this.stats.activeTime)
            };

            const res = await apiRequest("POST", "/api/activity/sync", payload);
            const data = await res.json();

            queryClient.invalidateQueries({ queryKey: ["/api/activity/today"] });

            return data;
        } catch (err) {
            console.error("Sync failed", err);
        }
    }

    private notifyListeners() {
        this.listeners.forEach(l => l({ ...this.stats }));
    }

    // Logic Helpers
    private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Earth radius in meters
        const phi1 = lat1 * Math.PI / 180;
        const phi2 = lat2 * Math.PI / 180;
        const deltaPhi = (lat2 - lat1) * Math.PI / 180;
        const deltaLambda = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in meters
    }
}

export const healthService = HealthService.getInstance();

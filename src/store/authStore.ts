import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
    accessToken: string | null;
    loginTimestamp: number | null;
    isLoading: boolean;
    error: string | null;

    login: (email: string, pass: string) => Promise<boolean>;
    checkAuth: () => Promise<boolean>;
    logout: () => Promise<void>;
}

// Mock API Call
const mockLoginApi = async (email: string, pass: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (email && pass) {
                // Return a fake JWT token
                resolve("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake-token");
            } else {
                reject("Invalid credentials");
            }
        }, 1000);
    });
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            accessToken: null,
            loginTimestamp: null,
            isLoading: false,
            error: null,

            login: async (email, pass) => {
                set({ isLoading: true, error: null });
                try {
                    const token = await mockLoginApi(email, pass);
                    const timestamp = Date.now();

                    set({
                        accessToken: token,
                        loginTimestamp: timestamp,
                        isLoading: false
                    });
                    return true;
                } catch (e) {
                    set({
                        error: "Login failed. Please check your credentials.",
                        isLoading: false
                    });
                    return false;
                }
            },

            checkAuth: async () => {
                const { accessToken, loginTimestamp } = get();

                if (!accessToken || !loginTimestamp) {
                    return false;
                }

                const now = Date.now();
                const isValid = (now - loginTimestamp) < SEVEN_DAYS_MS;

                if (!isValid) {
                    // Token expired
                    set({ accessToken: null, loginTimestamp: null });
                    return false;
                }

                return true;
            },

            logout: async () => {
                set({ accessToken: null, loginTimestamp: null });
                await AsyncStorage.removeItem('auth-storage');
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

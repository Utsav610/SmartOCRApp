import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import DeviceInfo from 'react-native-device-info';

interface User {
    id: string;
    username: string;
    role: string;
    companies: any[];
}

interface AuthState {
    accessToken: string | null;
    user: User | null;
    loginTimestamp: number | null;
    isLoading: boolean;
    error: string | null;

    login: (username: string, pass: string) => Promise<boolean>;
    checkAuth: () => Promise<boolean>;
    logout: () => Promise<void>;
}

const BASE_URL = 'http://ocr.astram.tech.dedi6594.your-server.de';

const loginApi = async (username: string, pass: string): Promise<{ accessToken: string; user: User }> => {
    try {
        const deviceName = await DeviceInfo.getDeviceName();
        console.log('device name', deviceName);

        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: pass,
                deviceId: deviceName || "mobile-app-device",
            }),
        });

        const data = await response.json();
        console.log('data', data);


        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        return data;
    } catch (error: any) {
        throw new Error(error.message || 'Network error');
    }
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;


export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            accessToken: null,
            user: null,
            loginTimestamp: null,
            isLoading: false,
            error: null,

            login: async (username, pass) => {
                set({ isLoading: true, error: null });
                try {
                    const { accessToken, user } = await loginApi(username, pass);
                    const timestamp = Date.now();

                    set({
                        accessToken: accessToken,
                        user: user,
                        loginTimestamp: timestamp,
                        isLoading: false
                    });
                    return true;
                } catch (e: any) {
                    set({
                        error: e.message || "Login failed. Please check your credentials.",
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
                const isValid = (now - loginTimestamp) < ONE_HOUR_MS;

                if (!isValid) {
                    // Token expired
                    set({ accessToken: null, user: null, loginTimestamp: null });
                    return false;
                }

                return true;
            },

            logout: async () => {
                set({ accessToken: null, user: null, loginTimestamp: null });
                await AsyncStorage.removeItem('auth-storage');
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

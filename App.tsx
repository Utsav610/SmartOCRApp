import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useInspectionStore } from './src/store/inspectionStore';
import { colors } from './src/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App: React.FC = () => {
    const store = useInspectionStore();

    useEffect(() => {
        if (store?.loadInspections) {
            store.loadInspections();
        }
    }, [store]);

    return (
        <SafeAreaProvider>
            <GestureHandlerRootView>
                <StatusBar
                    barStyle="light-content"
                    backgroundColor={colors.background}
                />
                <AppNavigator />
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
};

export default App;

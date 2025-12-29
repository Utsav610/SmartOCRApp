import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useInspectionStore } from './src/store/inspectionStore';
import { colors } from './src/theme';

const App: React.FC = () => {
    const store = useInspectionStore();

    useEffect(() => {
        if (store?.loadInspections) {
            store.loadInspections();
        }
    }, [store]);

    return (
        <>
            <StatusBar
                barStyle="light-content"
                backgroundColor={colors.background}
            />
            <AppNavigator />
        </>
    );
};

export default App;

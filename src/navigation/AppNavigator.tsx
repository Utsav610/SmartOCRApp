import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InspectionListScreen } from '../screens/InspectionListScreen';
import { GridInspectionScreen } from '../screens/GridInspectionScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { ReadingConfirmationScreen } from '../screens/ReadingConfirmationScreen';
import { ManualEntryModal } from '../screens/ManualEntryModal';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}>
                <Stack.Screen
                    name="InspectionList"
                    component={InspectionListScreen}
                />
                <Stack.Screen
                    name="GridInspection"
                    component={GridInspectionScreen}
                />
                <Stack.Screen
                    name="Camera"
                    component={CameraScreen}
                    options={{
                        animation: 'fade',
                    }}
                />
                <Stack.Screen
                    name="ReadingConfirmation"
                    component={ReadingConfirmationScreen}
                />
                <Stack.Screen
                    name="ManualEntry"
                    component={ManualEntryModal}
                    options={{
                        presentation: 'transparentModal',
                        animation: 'slide_from_bottom',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

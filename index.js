/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee from '@notifee/react-native';

// ONLY Notifee background handler - Firebase removed to prevent crash
notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('Notifee Background Event:', type, detail);
});

AppRegistry.registerComponent(appName, () => App);

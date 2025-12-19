import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuthStore } from './src/stores/authStore';
import { usePushNotifications } from './src/hooks/usePushNotifications';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ focused, label }: { focused: boolean; label: string }) {
  const icons: Record<string, string> = {
    홈: '🏠',
    업무: '📋',
    송영: '🚗',
    알림: '🔔',
    더보기: '⚙️',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icons[label]}</Text>
      <Text style={{ fontSize: 10, color: focused ? '#3b82f6' : '#9ca3af' }}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon focused={focused} label={route.name} />,
        tabBarShowLabel: false,
        tabBarStyle: { height: 60, paddingBottom: 8 },
      })}
    >
      <Tab.Screen name="홈" component={HomeScreen} />
      <Tab.Screen name="업무" component={TasksScreen} />
      <Tab.Screen name="송영" component={RidesScreen} />
      <Tab.Screen name="알림" component={NotificationsScreen} />
      <Tab.Screen name="더보기" component={MoreScreen} />
    </Tab.Navigator>
  );
}

// 임시 화면들
function TasksScreen() {
  return (
    <View style={styles.placeholder}>
      <Text>업무 목록</Text>
    </View>
  );
}

function RidesScreen() {
  return (
    <View style={styles.placeholder}>
      <Text>송영 현황</Text>
    </View>
  );
}

function NotificationsScreen() {
  return (
    <View style={styles.placeholder}>
      <Text>알림</Text>
    </View>
  );
}

function MoreScreen() {
  const logout = useAuthStore((state) => state.logout);
  return (
    <View style={styles.placeholder}>
      <Text onPress={logout} style={{ color: '#ef4444' }}>
        로그아웃
      </Text>
    </View>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="TaskDetail"
              component={TaskDetailScreen}
              options={{
                headerShown: true,
                headerTitle: '업무 상세',
                headerBackTitle: '뒤로',
              }}
            />
          </>
        )}
      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Configure how notifications are handled when the app is in the foreground
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Registers device for push notifications and configures channels for Android.
 * Returns the Expo Push Token if successful.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        await Notification.requestPermission();
      }
    }
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== "granted") {
      console.warn("Failed to get push token: permission not granted!");
      return null;
    }

    // Extract project ID from expo config or use the hardcoded fallback from app.json
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      "14bba26f-da87-45ab-ae43-95101d443928";

    if (projectId) {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log("Expo Push Token successfully fetched:", token);
    } else {
      console.warn("No EAS Project ID found in Expo configuration");
    }
  } catch (error) {
    console.error("Error registering for push notifications:", error);
  }

  // Android-specific settings: Importance, Vibration, Sound
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
    });
  }

  return token;
}

/**
 * Displays a local notification in the device's notification bar immediately.
 */
export async function sendLocalNotificationAsync(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        const notification = new Notification(title, { body });
        notification.onclick = () => {
          window.focus();
          window.dispatchEvent(new CustomEvent("notification-clicked", { detail: data }));
        };
      } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const notification = new Notification(title, { body });
          notification.onclick = () => {
            window.focus();
            window.dispatchEvent(new CustomEvent("notification-clicked", { detail: data }));
          };
        }
      }
    }
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: "default",
      },
      trigger: null, // Null means deliver immediately
    });
  } catch (error) {
    console.error("Error scheduling local notification:", error);
  }
}

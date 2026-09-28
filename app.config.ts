import { ConfigContext, ExpoConfig } from "expo/config";

const APP_NAME = "Modern Chat";
const PACKAGE_NAME = "com.modernchat.app";
const SCHEME = "modernchat";

export default ({ config }: ConfigContext): ExpoConfig => {
  const environment =
    (process.env.APP_ENV as "development" | "preview" | "production") ||
    "development";

  const isDev = environment === "development";

  return {
    ...config,
    name: isDev ? `${APP_NAME} Dev` : APP_NAME,
    slug: "modern-chat",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: isDev ? `${SCHEME}-dev` : SCHEME,
    userInterfaceStyle: "dark",

    android: {
      package: isDev ? `${PACKAGE_NAME}.dev` : PACKAGE_NAME,
      googleServicesFile: "./google-services.json", // 👈 Файл конфігурації Firebase
      adaptiveIcon: {
        backgroundColor: "#111827",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.VIBRATE",             // 👈 Дозвіл вібрації для пушів
        "android.permission.POST_NOTIFICATIONS",   // 👈 Системний дозвіл пушів Android 13+
      ],
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#111827",
          image: "./assets/images/splash-icon.png",
          imageWidth: 100,
        },
      ],
      "expo-secure-store",
      [
        "expo-audio",
        {
          microphonePermission: "Modern Chat потребує доступ до мікрофона для запису голосових повідомлень.",
          recordAudioAndroid: true,
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Modern Chat потребує доступ до камери для зйомки відеокружечків.",
          microphonePermission: "Modern Chat потребує доступ до мікрофона для запису відеокружечків.",
        },
      ],
      ["expo-video"],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#2563EB",
          defaultChannel: "default",
        },
      ],
    ],

    extra: {
      ...config.extra,
      eas: {
        projectId: config.extra?.eas?.projectId ?? "31bb06fc-5f4f-46d2-9f61-5a5bb43ebdcf",
      },
    },
  };
};

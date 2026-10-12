export default {
  expo: {
    name: "Influencer Marketplace MVP",
    slug: "influencer-marketplace-mvp",
    scheme: "influencer-marketplace-mvp",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#F7F5F2"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: false
    },
    newArchEnabled: true,
    android: {
      adaptiveIcon: {
        backgroundColor: "#F7F5F2"
      }
    },
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: false
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
};

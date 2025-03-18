import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth/react-native"; // ✅ Import đúng module
import { getReactNativePersistence } from "firebase/auth/react-native"; // ✅ Dùng module đúng
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCY91NMrjhIsSbCIBgblJkKj1a_D0s_3qE",
  authDomain: "seasondecorapp.firebaseapp.com",
  projectId: "seasondecorapp",
  storageBucket: "seasondecorapp.firebasestorage.app",
  messagingSenderId: "756855807439",
  appId: "1:756855807439:web:c9dd3bd126e76d59c186ba"
};

const app = initializeApp(firebaseConfig);

// ✅ Sử dụng AsyncStorage để lưu trạng thái đăng nhập
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export { auth, app };

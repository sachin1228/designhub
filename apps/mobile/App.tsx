import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";
import { StatusBar } from "expo-status-bar";
import Navigation from "./src/navigation";

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <Navigation />
    </>
  );
}

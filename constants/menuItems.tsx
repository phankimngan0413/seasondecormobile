import { Ionicons } from "@expo/vector-icons";

export const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; route: string }[] = [
  { icon: "person-outline", label: "Account", route: "/screens/Account" },
  { icon: "location-outline", label: "Address", route: "/screens/Addresses" },
  { icon: "notifications-outline", label: "Notifications", route: "/screens/Notifications" },
  { icon: "cart-outline", label: "Orders", route: "/screens/Orders" },
  { icon: "cube-outline", label: "Membership", route: "/screens/Membership" },
  { icon: "heart-outline", label: "Following", route: "/screens/Following" },
];
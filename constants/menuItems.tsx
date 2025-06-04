import { Ionicons } from "@expo/vector-icons";

export const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; route: string }[] = [
  { icon: "person-outline", label: "Account", route: "/screens/Account" },
  { icon: "location-outline", label: "Address", route: "/screens/Addresses" },
  { icon: "book-outline", label: "Bookings", route: "/screens/Bookings" },
  { icon: "cart-outline", label: "Orders", route: "/screens/Orders" },
  { icon: "heart-outline", label: "Favorites", route: "/screens/Favorites" },
  { icon: "heart-outline", label: "Following", route: "/screens/Following" },
  { icon: "star-outline", label: "Reviews", route: "/screens/Reviews" },
  { icon: "help-circle-outline", label: "Support", route: "/screens/Support" },
];
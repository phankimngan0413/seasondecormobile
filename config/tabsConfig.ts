import { Ionicons } from "@expo/vector-icons";

export const PRIMARY_COLOR = "#5fc1f1"; // Define primary color for consistency

// Define the type for the icon to restrict the allowed values
type IconName =
  | "home-outline"
  | "bed-outline"
  | "restaurant-outline"
  | "water-outline"
  | "tv-outline"
  | "search"
  | "repeat"
  | "link"
  | "filter"
  | "infinite"
  | "text"
  | "image"; // Add other valid Ionicons names

export interface INestedTab {
  label: string;
  beforeImage: string;
  afterImage: string;
}

export interface ITab {
  label: string;
  icon: IconName; // Use the IconName type to restrict valid icon names
  nestedTabs: INestedTab[]; // Nested tabs for each category
}

export const tabsConfig: ITab[] = [
  {
    label: "Living Room",
    icon: "tv-outline", // Correctly typed icon name
    nestedTabs: [
      {
        label: "Spring's Living Room",
        beforeImage:
          "https://havenly.com/blog/wp-content/uploads/2023/05/Screen-Shot-2022-01-24-at-4.26.21-PM-700x455.jpg",
        afterImage:
          "https://havenly.com/blog/wp-content/uploads/2023/05/kyliefitts_havenly_melissashome_7-3-700x466.jpg",
      },
      {
        label: "Jenna's Living Room",
        beforeImage:
          "https://havenly.com/blog/wp-content/uploads/2022/06/phpL8m1FZ-700x525.jpeg",
        afterImage:
          "https://havenly.com/blog/wp-content/uploads/2022/06/laurenmurdoch_020420_685575_01-700x473.jpg",
      },
    ],
  },
  {
    label: "Bedroom",
    icon: "bed-outline", // Correctly typed icon name
    nestedTabs: [
      {
        label: "Spring's Bedroom",
        beforeImage:
          "https://havenly.com/blog/wp-content/uploads/2022/06/php5kBn3J-700x525.jpeg",
        afterImage:
          "https://havenly.com/blog/wp-content/uploads/2022/06/kyliefitts_havenly_julibauer_16-700x457.jpg",
      },
      {
        label: "Jenna's Bedroom",
        beforeImage:
          "https://havenly.com/blog/wp-content/uploads/2023/11/daniellechiprut_021220_designerhometour_before06-700x452.jpg",
        afterImage:
          "https://havenly.com/blog/wp-content/uploads/2023/11/daniellechiprut_021220_designerhometour_22-2-700x448.jpg",
      },
    ],
  },
  {
    label: "Dining Room",
    icon: "restaurant-outline", // Correctly typed icon name
    nestedTabs: [
      {
        label: "Spring's Dining Room",
        beforeImage:
          "https://havenly.com/blog/wp-content/uploads/2023/05/IMG_2180-1-700x933.jpg",
        afterImage:
          "https://havenly.com/blog/wp-content/uploads/2023/05/kyliefitts_havenly_bradyburke_19-1-700x993.jpg",
      },
    ],
  },
  {
    label: "Bathroom",
    icon: "water-outline", // Correctly typed icon name
    nestedTabs: [
      {
        label: "Spring's Bathroom",
        beforeImage:
          "https://havenly.com/blog/wp-content/uploads/2022/06/83f085b3f15ab843a8d27e40397d876a-uncropped_scaled_within_1536_1152-700x467.jpg",
        afterImage:
          "https://havenly.com/blog/wp-content/uploads/2022/06/kyliefitts_havenly-process_51-3-700x1015.jpg",
      },
    ],
  },
];

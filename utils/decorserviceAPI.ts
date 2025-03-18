// utils/decorserviceAPI.ts

import { initApiClient } from "@/config/axiosConfig";

// Decor service interface
export interface IDecorService {
  id: number;
  style: string;
  basePrice: number;
  description: string;
  province: string;
  createAt: string;
  accountId: number;
  decorCategoryId: number;
  favoriteCount: number;
  images: string[]; // Array of image URLs
  seasons: {
    trim(): unknown; id: number; seasonName: string 
}[]; // Array of season objects
}

// Fetches all decor services (adjusted to match the correct endpoint)
export const getDecorServicesAPI = async (): Promise<IDecorService[]> => {
  const apiClient = await initApiClient();

  try {
    // Make GET request to the correct endpoint with no parameters
    const response = await apiClient.get("/api/DecorService");

    // Check if response contains data and ensure images are valid URIs
    if (response.data && Array.isArray(response.data)) {
      const decorServices = response.data.map((service: IDecorService) => {
        // Ensure that the images array contains valid image URLs
        const validImages = service.images.map((image: any) => {
          // Check if image is an object and extract the imageURL property
          return (image && image.imageURL) ? image.imageURL : 'https://via.placeholder.com/150'; // Fallback to placeholder if invalid
        });

        // Map over seasons and extract the seasonName from each season object
        const validSeasons = service.seasons.map((season: any) => season.seasonName || 'No Season');

        // Return updated decor service with valid image URIs and season names
        return { 
          ...service, 
          images: validImages,
          seasons: validSeasons, // Add season names to seasons array
        };
      });

      console.log("🟢 Decor Services:", decorServices);
      return decorServices;
    } else {
      console.error("🔴 Invalid API response format");
      throw new Error("Failed to fetch decor services: Invalid response format.");
    }
  } catch (error: any) {
    console.error("🔴 Fetch Decor Services Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch decor services.");
  }
};

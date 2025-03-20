import { initApiClient } from "@/config/axiosConfig";

// Decor service interface
export interface IDecor {
  id: number;
  style: string;
  basePrice: number;
  description: string;
  province: string;
  createAt: string;
  accountId: number;
  decorCategoryId: number;
  favoriteCount: number;
  images: string[];
  seasons: { id: number; seasonName: string }[] | string[];
}

// Fetches all decor services (adjusted to match the correct endpoint)
export const getDecorServicesAPI = async (): Promise<IDecor[]> => {
  const apiClient = await initApiClient();

  try {
    // Make GET request to the correct endpoint with no parameters
    const response = await apiClient.get("/api/DecorService");

    // Check if response contains data and ensure images are valid URIs
    if (response.data && Array.isArray(response.data)) {
      const decorServices = response.data.map((service: IDecor) => {
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
// Fetches a single decor service by ID
export const getDecorServiceByIdAPI = async (id: number): Promise<IDecor> => {
  const apiClient = await initApiClient();

  try {
    // Make GET request to fetch a specific decor service by ID
    const response = await apiClient.get(`/api/DecorService/${id}`);

    // Log the response to inspect its structure
    console.log("API Response:", response); // Log the entire response

    // Check if response contains the expected data structure
    if (response.data) {
      const service = response.data; // Now directly accessing response.data

      // Ensure that the images array contains valid image URLs
      const validImages = service.images.map((image: any) => {
        // Check if image is an object and extract the imageURL property
        return image?.imageURL ? image.imageURL : 'https://via.placeholder.com/150'; // Fallback to placeholder if invalid
      });

      // Process the seasons array
      const validSeasons = service.seasons.map((season: any) => season.seasonName || 'No Season');

      // Return updated decor service with valid image URIs and season names
      return {
        ...service,
        images: validImages,
        seasons: validSeasons, // Add season names to seasons array
      };
    } else {
      console.error("🔴 Invalid API response format: Expected 'response.data'");
      throw new Error("Failed to fetch decor service: Invalid response format.");
    }
  } catch (error: any) {
    console.error("🔴 Fetch Decor Service by ID Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch decor service by ID.");
  }
};

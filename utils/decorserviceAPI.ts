import { initApiClient } from "@/config/axiosConfig";
import { IProvider } from "./productAPI";

// Decor service interface
// Update your IDecor interface to match the actual API response:
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
  images: string[]; // Changed to string[] to match your API response
  seasons: string[] | Array<{id: number; name: string; seasonName?: string;}>;
  provider?: IProvider;
  categoryName?: string;
  sublocation?: string;
  serviceName?: string; // Có thể sẽ lấy từ categoryName hoặc style
  price?: number; // Có thể sẽ lấy từ basePrice
  imageUrls?: string[]; // Map từ images
  rate?: number;
  totalRating?: number;
address:string;
}

// Then use type guards in your component to handle both possibilities
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

      return decorServices;
    } else {
      throw new Error("Failed to fetch decor services: Invalid response format.");
    }
  } catch (error: any) {
    console.error("🔴 Fetch Decor Services Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch decor services.");
  }
};
// Fetches a single decor service by ID
export const getDecorServiceByIdAPI = async (id: number): Promise<IDecor | null> => {
  const apiClient = await initApiClient();
  
  try {
    const response = await apiClient.get(`/api/DecorService/${id}`);
    const service = response.data;
    
    // Xử lý mảng images
    const images = service.images?.map((img: any) => 
      img?.imageURL || 'https://via.placeholder.com/150'
    ) || [];
    
    // Xử lý mảng seasons
    const seasons = service.seasons?.map((season: any) => 
      season?.seasonName || 'No Season'
    ) || [];
    
    return {
      ...service,
      images,
      seasons
    };
    
  } catch (error: any) {
    // Trả về null thay vì throw error
    console.log('Decor service fetch failed silently');
    return null;
  }
};
export const getDecorServiceByProviderAPI = async (slug: string): Promise<any> => {
  try {
    // Log the slug being used to ensure it's correct
    console.log("🔍 Fetching Decor Service for Slug:", slug);

    // Validate slug before making API call
    if (!slug) {
      console.error("🚨 Invalid slug: Cannot fetch decor service");
      throw new Error("Invalid provider slug");
    }

    const apiClient = await initApiClient();
    console.log("✅ API Client Initialized Successfully");

    // Detailed logging of the full API endpoint
    const endpoint = `/api/DecorService/getDecorServiceByProvider/${slug}`;
    console.log("🌐 API Endpoint:", endpoint);

    try {
      const response = await apiClient.get(endpoint);
      
      // More comprehensive response logging

      // Handle empty arrays or null/undefined response data
      if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
        // Return empty array instead of throwing an error
        console.log("ℹ️ No decor services found for this provider");
        return []; // Return empty array instead of throwing error
      }

      // Process single object or array of objects
      const services = Array.isArray(response.data) ? response.data : [response.data];
      
      // Process each service
      return services.map(service => {
        // Robust image processing
        const validImages = service.images && service.images.length > 0 
          ? service.images 
          : ["https://via.placeholder.com/150"];

        // Robust seasons processing
        const validSeasons = service.seasons && Array.isArray(service.seasons)
          ? service.seasons.map((season: any) => {
              if (typeof season === 'string') return season;
              return season.seasonName || season.name || "No Season";
            })
          : ["No Season"];

        // Return processed service data
        return {
          ...service,
          images: validImages,
          seasons: validSeasons,
        };
      });

    } catch (apiError: any) {
      // Special handling for 404 (Not Found) responses
      if (apiError.response?.status === 404) {
        console.log("ℹ️ No decor services found for this provider (404 response)");
        return []; // Return empty array for 404 responses
      }
      
      console.error("🔴 API Request Error:", {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message
      });
      
      throw new Error(apiError.response?.data?.message || "Failed to fetch decor services");
    }

  } catch (error: any) {
    console.error("🚨 Comprehensive Error in getDecorServiceByProviderAPI:", error);
    
    // Re-throw the error
    throw error;
  }
};
// Search decor services with filter parameters
export const searchDecorServicesAPI = async (
  params: {
    style?: string;
    sublocation?: string;
    categoryName?: string;
    seasonNames?: string[];
  }
): Promise<IDecor[]> => {
  const apiClient = await initApiClient();
  
  try {
    // Create URLSearchParams object for query parameters
    const queryParams = new URLSearchParams();
    
    // Add parameters only if they exist and have value
    if (params.style) queryParams.append('Style', params.style);
    if (params.sublocation) queryParams.append('Sublocation', params.sublocation);
    if (params.categoryName) queryParams.append('CategoryName', params.categoryName);
    
    // Handle array of season names
    if (params.seasonNames && params.seasonNames.length > 0) {
      params.seasonNames.forEach(season => {
        queryParams.append('SeasonNames', season);
      });
    }
    
    // Make the GET request with query parameters
    const url = `/api/DecorService/search?${queryParams.toString()}`;
    console.log("🔍 Searching decor services with URL:", url);
    
    const response = await apiClient.get(url);
    
    // Handle response data
    if (response.data && Array.isArray(response.data)) {
      // Process each decor service
      const decorServices = response.data.map((service: IDecor) => {
        // Process images (handle both string[] and object[] formats)
        const validImages = Array.isArray(service.images) 
          ? service.images.map((image: any) => {
              return typeof image === 'string' 
                ? image 
                : (image && image.imageURL) 
                  ? image.imageURL 
                  : 'https://via.placeholder.com/150';
            })
          : ['https://via.placeholder.com/150'];
        
        // Process seasons (handle both string[] and object[] formats)
        const validSeasons = Array.isArray(service.seasons)
          ? service.seasons.map((season: any) => {
              if (typeof season === 'string') return season;
              return season.seasonName || season.name || "No Season";
            })
          : ["No Season"];
        
        // Return processed service
        return {
          ...service,
          images: validImages,
          seasons: validSeasons,
        };
      });
      
      return decorServices;
    } else {
      // If response.data is not an array, return an empty array
      console.log("ℹ️ No matching decor services found");
      return [];
    }
  } catch (error: any) {
    // Log error details
    console.error("🔴 Search Decor Services Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Return empty array for 404 (Not Found) responses
    if (error.response?.status === 404) {
      console.log("ℹ️ No matching decor services found (404 response)");
      return [];
    }
    
    // Throw error for other errors
    throw new Error(error.response?.data?.message || "Failed to search decor services.");
  }
};
import { initApiClient } from "@/utils/axiosConfig";
import { LogBox } from "react-native";

// LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

export const getChatListAPI = async (): Promise<any[]> => {
  const url = "/api/Chat/getall"; // Adjust the endpoint based on your backend
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get<any[]>(url);
    
    // Log the complete response details for debugging
    console.log("Request URL:", apiClient.defaults.baseURL + url);
    console.log("Response Status:", response.status);
    console.log("Response Headers:", response.headers);
    console.log("Full API Response:", response.data);

    // Check if response data is valid
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error("API response is not an array: ", response.data);
      throw new Error("API Response is not an array");
    }
  } catch (error: any) {
    console.error("Error fetching chat list:", error);
    
    // Check for specific error response from the server
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      console.error("Error Status Code:", error.response.status);
    } else {
      console.error("Network or other Error:", error.message);
    }

    // Throw error with more descriptive message
    return Promise.reject(new Error("Failed to fetch data from the server. Please check the API endpoint."));
  }
};

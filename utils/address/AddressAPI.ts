import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initApiClient } from "@/utils/axiosConfig";  // Ensure Axios instance is initialized correctly
import { LogBox } from "react-native";  // Correct import for React Native

// Ignore warnings for common Axios issues (like 400 errors)
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

// Create Axios client instance using initApiClient
const apiClient = initApiClient();

// Define the API endpoint for address-related requests
const SUB_URL = `api/Address`;

// Fetch all addresses
export function useGetAllAddress() {
  return useQuery<any>({
    queryKey: ["addressList"],
    queryFn: async () => {
      try {
        const response = await (await apiClient).get(`/${SUB_URL}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching addresses:", error);
        throw new Error("Error fetching addresses");
      }
    },
    staleTime: 5 * 60 * 1000, // Cache the data for 5 minutes
  });
}

// Create a new address
export function useCreateAddress(data: any) {
  const queryClient = useQueryClient();
  return useMutation<any, unknown, string>({
    mutationKey: ["create_address"],
    mutationFn: async (data: any): Promise<any> => {
      try {
        const response = await (await apiClient).post(`/${SUB_URL}`, data);
        return response.data;
      } catch (error) {
        console.error("Error creating address:", error);
        throw new Error("Error creating address");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addressList"] });
    },
    onError: (error: any) => {
      console.error("Error creating address:", error.message);
    },
  });
}

// Update an existing address
export function useUpdateAddress(id: string, data: { [key: string]: any; }) {
  const queryClient = useQueryClient();
  return useMutation<any, unknown, { id: string; [key: string]: any }>({
    mutationKey: ["update_address"],
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }): Promise<any> => {
      try {
        const response = await (await apiClient).put(`/${SUB_URL}/${id}`, data);
        return response.data;
      } catch (error) {
        console.error("Error updating address:", error);
        throw new Error("Error updating address");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addressList"] });
    },
    onError: (error: any) => {
      console.error("Error updating address:", error.message);
    },
  });
}

// Delete an address
export function useDeleteAddress(addressId?: string) {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationKey: ["delete_address"],
    mutationFn: async (addressId: string): Promise<void> => {
      try {
        await (await apiClient).delete(`/${SUB_URL}/${addressId}`);
      } catch (error) {
        console.error("Error deleting address:", error);
        throw new Error("Error deleting address");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addressList"] });
    },
    onError: (error: any) => {
      console.error("Error deleting address:", error.message);
    },
  });
}

// Set default address
export function useSetDefaultAddress(id: string) {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationKey: ["set_default_address"],
    mutationFn: async (id: string): Promise<void> => {
      try {
        await (await apiClient).post(`/${SUB_URL}/set-default/${id}`);
      } catch (error) {
        console.error("Error setting default address:", error);
        throw new Error("Error setting default address");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addressList"] });
    },
    onError: (error: any) => {
      console.error("Error setting default address:", error.message);
    },
  });
}

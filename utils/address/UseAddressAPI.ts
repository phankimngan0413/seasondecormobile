import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetAllAddress, useCreateAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from '../AddressAPI'; // Importing from the correct file

// Fetch all addresses
export function useFetchAllAddresses() {
  return useQuery({
    queryKey: ["addressList"],
    queryFn: async () => {
      return await useGetAllAddress(); // Make sure the function is imported and used here correctly
    },
    staleTime: 5 * 60 * 1000, // Cache the data for 5 minutes
  });
}

// Create a new address
export function useAddNewAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["create_address"],
    mutationFn: async (data: any) => {
      return await useCreateAddress(data);
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
export function useModifyAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["update_address"],
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      return await useUpdateAddress(id, data);
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
export function useRemoveAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete_address"],
    mutationFn: async (addressId: string) => {
      return await useDeleteAddress(addressId);
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
export function useMarkDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["set_default_address"],
    mutationFn: async (id: string) => {
      return await useSetDefaultAddress(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addressList"] });
    },
    onError: (error: any) => {
      console.error("Error setting default address:", error.message);
    },
  });
}

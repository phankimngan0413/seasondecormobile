import { useState } from "react";
import { deleteAddressAPI } from '@/utils/AddressAPI'; // Import the API function

export const useDeleteAddress = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAddress = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await deleteAddressAPI(id);  // Call the delete API function
      if (response) {
        // Optionally handle success (e.g., remove the address from the list)
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete address.");
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate: deleteAddress, isLoading, error };
};

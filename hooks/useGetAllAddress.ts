import { useState, useEffect } from "react";
import { getAddressesAPI, IAddress} from '@/utils/AddressAPI'; // Import the API function

export const useGetAllAddress = () => {
  const [data, setData] = useState<IAddress[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await getAddressesAPI();
        setData(response);  // Set the fetched addresses
      } catch (err: any) {
        setError(err.message || "Failed to fetch addresses.");
      } finally {
        setIsLoading(false);  // Done loading
      }
    };

    fetchAddresses();
  }, []);

  return { data, isLoading, error };
};

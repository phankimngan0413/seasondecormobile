import { initApiClient } from "@/config/axiosConfig";

// Types for contract operations
export interface IContractResponse {
  success: boolean;
  message?: string;
  errors?: any[];
  data?: any;
}

export interface IContractContent {
  success: boolean;
  contractId: number;
  contractCode: string;
  content: string;
  filePath?: string;
  status: number;
  isSigned: boolean;
  createdAt: string;
  message?: string;
}

/**
 * Get contract content by contract code
 * @param contractCode The code of the contract to retrieve
 * @returns Promise with the contract content information
 */
export const getContractContentAPI = async (contractCode: string): Promise<IContractContent> => {
  try {
    const apiClient = await initApiClient();
    
    const response = await apiClient.get(
      `/api/Contract/getContractContent/${contractCode}`
    );
    
    if (response && response.data) {
      return response.data;
    } else {
      console.log("Invalid contract content response:", response);
      return {
        success: false,
        contractId: 0,
        contractCode: "",
        content: "",
        status: 0,
        isSigned: false,
        createdAt: new Date().toISOString(),
        message: "Failed to retrieve contract content"
      };
    }
  } catch (error: any) {
    console.log("Error fetching contract content:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      contractId: 0,
      contractCode: "",
      content: "",
      status: 0,
      isSigned: false,
      createdAt: new Date().toISOString(),
      message: "Failed to connect to contract service"
    };
  }
};

/**
 * Request signature for a contract
 * @param contractCode The code of the contract to sign
 * @returns Promise with the signature request result
 */
export const requestSignatureAPI = async (contractCode: string): Promise<IContractResponse> => {
  try {
    const apiClient = await initApiClient();
    
    const response = await apiClient.post(
      `/api/Contract/requestSignature/${contractCode}`,
      null // No request body needed
    );
    
    if (response && response.data) {
      return response.data;
    } else {
      console.log("Invalid request signature response:", response);
      return {
        success: false,
        message: "Failed to request signature"
      };
    }
  } catch (error: any) {
    console.log("Error requesting signature:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to request signature"
    };
  }
};

/**
 * Get contract by quotation code
 * @param quotationCode The code of the quotation to get contract for
 * @returns Promise with the contract information
 */
export const getContractByQuotationAPI = async (quotationCode: string): Promise<IContractContent> => {
  try {
    const apiClient = await initApiClient();
    
    const response = await apiClient.get(
      `/api/Contract/getContractByQuotation/${quotationCode}`
    );
    
    if (response && response.data) {
      return response.data;
    } else {
      console.log("Invalid contract response:", response);
      return {
        success: false,
        contractId: 0,
        contractCode: "",
        content: "",
        status: 0,
        isSigned: false,
        createdAt: new Date().toISOString(),
        message: "Failed to retrieve contract"
      };
    }
  } catch (error: any) {
    console.log("Error fetching contract:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      contractId: 0,
      contractCode: "",
      content: "",
      status: 0,
      isSigned: false,
      createdAt: new Date().toISOString(),
      message: "Failed to connect to contract service"
    };
  }
};
export const getContractFileAPI = async (quotationCode: string) => {
  try {
    const apiClient = await initApiClient();
    
    // Use the endpoint
    const response = await apiClient.get(`/api/Contract/getContractFile/${quotationCode}`);
    
    if (response && response.data) {
      // The API returns the data directly, not wrapped in a data property
      return {
        success: true,
        message: "Contract file URL retrieved successfully",
        data: response.data  // Return the data directly
      };
    } else {
      console.log("Invalid contract file response:", response);
      return {
        success: false,
        message: "Failed to retrieve contract file"
      };
    }
  } catch (error: any) {
    console.log("Error fetching contract file:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to retrieve contract file"
    };
  }
};
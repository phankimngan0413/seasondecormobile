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
// Define the response type for getContractFileAPI
export interface IContractFileResponse {
  success: boolean;
  message?: string;
  errors?: string[];
  data?: IContractDetail | null;
}

// Interface matching the API response for contract details
export interface IContractDetail {
  contractCode: string;
  status: number;
  isSigned: boolean;
  // ...other properties
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
// Replace the beginning of your requestSignatureAPI function with this code
export const requestSignatureAPI = async (contractCode: string): Promise<IContractResponse> => {
  try {
    const apiClient = await initApiClient();
    
    // Make the API request
    const response = await apiClient.post(
      `/api/Contract/requestSignatureForMobile/${contractCode}`,
      null // No request body needed
    );
    
    console.log("Signature API raw response:", response.data);
    
    // Even if response.data is null, the API call succeeded
    // We can assume the email was sent if we didn't get an error
    return {
      success: true,
      message: "Signature request has been sent to your email. Please check your inbox.",
      data: null
    };
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
export const verifySignatureAPI = async (token: string): Promise<IContractResponse> => {
  try {
    const apiClient = await initApiClient();
    
    // Đóng gói token trong một đối tượng để gửi làm JSON
    const requestBody = JSON.stringify(token);
    
    const response = await apiClient.post(
      `/api/Contract/verifySignature`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response && response.data) {
      console.log("Verification response:", response.data);
      return response.data;
    } else {
      console.log("Invalid signature verification response:", response);
      return {
        success: false,
        message: "Failed to verify signature"
      };
    }
  } catch (error: any) {
    console.log("Error verifying signature:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to verify signature"
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
import { initApiClient } from "@/config/axiosConfig";

// Types for wallet operations
export interface IWalletBalance {
  success: boolean;
  balance: number;
  currency: string;
  lastUpdated: string;
  message?: string;
}

export interface ITransaction {
  transactionId: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'completed' | 'pending' | 'failed';
  description: string;
  timestamp: string;
  receiverId?: number;
  receiverName?: string;
  fees?: number;
}

export interface ITransactionsResponse {
  success: boolean;
  transactions: ITransaction[];
  totalCount: number;
  message?: string;
}

export interface ITransferFundsRequest {
  receiverId: number;
  amount: number;
  description?: string;
}

export interface ITransferFundsResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
  errors?: string[];
}

/**
 * Get current wallet balance
 * @returns Promise with the wallet balance information
 */
export const getWalletBalanceAPI = async (): Promise<IWalletBalance> => {
  const url = "/api/wallet/getWalletBalance";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    if (response && response.data) {
      return response.data;
    } else {
      console.error("🔴 Invalid wallet balance response:", response);
      return {
        success: false,
        balance: 0,
        currency: "VND",
        lastUpdated: new Date().toISOString(),
        message: "Failed to retrieve balance information"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error fetching wallet balance:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      balance: 0,
              currency: "VND",
      lastUpdated: new Date().toISOString(),
      message: "Failed to connect to wallet service"
    };
  }
};

/**
 * Get transaction history details
 * @param page Optional page number for pagination
 * @param limit Optional limit of transactions per page
 * @returns Promise with transaction details
 */
export const getTransactionsDetailsAPI = async (
  page: number = 1, 
  limit: number = 20
): Promise<ITransactionsResponse> => {
  const url = "/api/wallet/getTransactionsDetails";
  const params = { page, limit };
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url, { params });
    
    if (response && response.data && Array.isArray(response.data.transactions)) {
      return response.data;
    } else {
      console.error("🔴 Invalid transactions response:", response);
      return {
        success: false,
        transactions: [],
        totalCount: 0,
        message: "Invalid response format from the server"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error fetching transactions:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      transactions: [],
      totalCount: 0,
      message: "Failed to fetch transaction history"
    };
  }
};

/**
 * Transfer funds to another user
 * @param transferData Object containing receiverId, amount and optional description
 * @returns Promise with transfer result
 */
export const transferFundsAPI = async (
  transferData: ITransferFundsRequest
): Promise<ITransferFundsResponse> => {
  const url = "/api/wallet/transferFunds";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.post(url, transferData);
    
    return response.data;
  } catch (error: any) {
    console.error("🔴 Error transferring funds:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: "Failed to process the transfer request"
    };
  }
};

/**
 * Get a single transaction by ID
 * @param transactionId The ID of the transaction to retrieve
 * @returns Promise with transaction details
 */
export const getTransactionByIdAPI = async (
  transactionId: string
): Promise<{ success: boolean; transaction?: ITransaction; message?: string }> => {
  const url = `/api/wallet/transaction/${transactionId}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    if (response && response.data && response.data.transaction) {
      return response.data;
    } else {
      console.error("🔴 Invalid transaction response:", response);
      return {
        success: false,
        message: "Transaction not found or invalid response format"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error fetching transaction:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: "Failed to retrieve transaction details"
    };
  }
};
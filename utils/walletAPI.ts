import { initApiClient } from "@/config/axiosConfig";

// Types for wallet operations
export interface IWalletBalance {
  success: boolean;
  balance: number;
  currency: string;
  lastUpdated: string;
  message?: string;
}

export interface WalletData {
  walletId: number;
  balance: number;
}

// Exact definition based on response
export interface IServerTransaction {
  id: number;
  paymentTransactionId: number;
  amount: number;
  transactionDate: string;
  transactionStatus: string;
  transactionType: string;
}

// Exact API response structure
export interface IServerResponse {
  success: boolean;
  message: string;
  errors: any[];
  data: IServerTransaction[];
}

// Interface for UI
export interface ITransaction {
  transactionId: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'completed' | 'pending' | 'failed';
  description: string;
  timestamp: string;
}

export interface ITransactionsResponse {
  success: boolean;
  transactions: ITransaction[];
  totalCount: number;
  message?: string;
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
    
    // Add this line to debug
    
    if (response && response.data) {
      return response.data;
    } else {
      console.log("Invalid wallet balance response:", response);
      return {
        success: false,
        balance: 0,
        currency: "VND",
        lastUpdated: new Date().toISOString(),
        message: "Failed to retrieve balance information"
      };
    }
  } catch (error: any) {
    console.log("Error fetching wallet balance:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
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
 * Convert from server format to UI format
 */
function mapTransaction(tx: IServerTransaction): ITransaction {
  // Determine transaction type
  const type = tx.transactionType === "TopUp" ? "credit" : "debit";
  
  // Determine status
  const status = tx.transactionStatus === "Success" ? "completed" : 
                 tx.transactionStatus === "Pending" ? "pending" : "failed";
  
  // Create description
  const description = tx.transactionType === "TopUp" ? "Top-up to wallet" : tx.transactionType;
  
  return {
    transactionId: tx.id.toString(),
    amount: tx.amount,
    type,
    status,
    description,
    timestamp: tx.transactionDate
  };
}

/**
 * Get transaction history details
 * @returns Promise with transaction details
 */
export const getTransactionsDetailsAPI = async (): Promise<ITransactionsResponse> => {
  try {
    const apiClient = await initApiClient();
    const response = await apiClient.get("/api/wallet/getTransactionsDetails");
    
    // Check if response.data is an array
    if (response && response.data && Array.isArray(response.data)) {
      const transactions = response.data.map(mapTransaction);
      
      return {
        success: true,
        transactions,
        totalCount: transactions.length,
        message: "Transactions retrieved successfully"
      };
    }
    
    // Check if response.data is an object with a data property that is an array
    if (response?.data?.success && Array.isArray(response.data.data)) {
      const transactions = response.data.data.map(mapTransaction);
      
      return {
        success: true,
        transactions,
        totalCount: transactions.length,
        message: response.data.message
      };
    }
    
    return {
      success: false,
      transactions: [],
      totalCount: 0,
      message: "No transactions found"
    };
  } catch (error) {
    console.log("Error fetching transaction history:", error);
    
    return {
      success: false,
      transactions: [],
      totalCount: 0,
      message: "Error while retrieving transaction history"
    };
  }
}
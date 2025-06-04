import { initApiClient } from "@/config/axiosConfig";
import { getToken } from "@/services/auth";

export interface ISupportTicket {
  id?: string;
  subject: string;
  description: string;
  ticketTypeId: number;
  bookingCode?: string;
  attachments?: File[] | string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPaginatedSupportTickets {
  data: ISupportTicket[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface IApiResponse<T = any> {
  success: boolean;
  errors?: string[];
  data?: T;
  message?: string;
}

export interface ISupportTicketParams {
  bookingCode?: string;
  ticketTypeId?: number;
  isSolved?: boolean;
  pageIndex?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
}

interface APIResponse<T> {
  success: boolean;
  message: string;
  errors: string[];
  data: T;
}

export interface ITicketType {
  id: number;
  type: string;
}

// Improved helper function for API calls
const handleApiRequest = async <T>(request: Promise<any>): Promise<T> => {
  try {
    const response = await request;
    const responseData = response.data;

    // Check if the response has the expected structure
    if (responseData && typeof responseData.success === 'boolean') {
      if (responseData.success && responseData.data) {
        return responseData.data;
      } else {
        const errorMessage = responseData.errors?.join(", ") || responseData.message || "An unknown error occurred.";
        throw new Error(errorMessage);
      }
    } else {
      // For responses without the standard structure, return the raw data
      return response.data;
    }
  } catch (error: any) {
    console.error("API Request Error:", error);
    throw new Error(error?.message || "An error occurred during the request.");
  }
};

// POST /api/Support/createTicket: Create a new support ticket
// Fixed createSupportTicketAPI - use fetch like createBookingAPI
export const createSupportTicketAPI = async (ticketData: ISupportTicket): Promise<IApiResponse> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    console.log("📤 Sending support ticket data:", ticketData);
    
    // Use FormData like in createBookingAPI
    const formData = new FormData();
    
    // Add basic fields with PascalCase
    formData.append('Subject', ticketData.subject);
    formData.append('Description', ticketData.description);
    formData.append('TicketTypeId', ticketData.ticketTypeId.toString());
    
    if (ticketData.bookingCode) {
      formData.append('BookingCode', ticketData.bookingCode);
    }
    
    // Handle attachments like images in createBookingAPI
    if (ticketData.attachments && ticketData.attachments.length > 0) {
      console.log(`📎 Adding ${ticketData.attachments.length} attachments to FormData...`);
      
      let validAttachmentCount = 0;
      for (let index = 0; index < ticketData.attachments.length; index++) {
        const file = ticketData.attachments[index] as any; // Type assertion for React Native compatibility
        
        if (file && (file.size > 0 || file.uri)) { // Accept both File objects and RN objects
          console.log(`📎 Adding attachment ${index + 1}: ${file.name} (${file.size || 'unknown size'} bytes, ${file.type})`);
          
          // Use the field name that your API expects
          formData.append('Attachments', file);
          
          validAttachmentCount++;
        } else {
          console.warn(`⚠️ Skipping invalid attachment at index ${index}:`, file);
        }
      }
      
      console.log(`✅ Added ${validAttachmentCount} valid attachments to FormData with field name 'Attachments'`);
    } else {
      console.log('📎 No attachments to add');
    }
    
    // Get base URL from API client or use direct URL
    const apiClient = await initApiClient();
    const baseURL = apiClient.defaults?.baseURL || "http://10.0.2.2:5297";
    const url = `${baseURL}/api/Support/createTicket`;
    
    console.log("📞 Making request to:", url);
    
    // Use direct fetch with exact same pattern as createBookingAPI
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // DON'T set Content-Type - let browser handle FormData boundary
      },
      body: formData,
    });
    
    const responseData = await response.json();
    console.log("📥 Raw API response:", responseData);
    
    // Handle response similar to createBookingAPI
    if (responseData && typeof responseData === 'object') {
      // Check if response has success field
      if ('success' in responseData) {
        return {
          success: responseData.success,
          message: responseData.message || (responseData.success ? "Ticket created successfully" : "Failed to create ticket"),
          errors: responseData.errors || [],
          data: responseData.data
        };
      }
      
      // If response is direct ticket data (has id field)
      if ('id' in responseData) {
        console.log("✅ Ticket created successfully - direct data response");
        return {
          success: true,
          message: "Ticket created successfully",
          errors: [],
          data: responseData
        };
      }
    }
    
    // Fallback - assume success if we got some data
    return {
      success: true,
      message: "Ticket created successfully",
      errors: [],
      data: responseData
    };
    
  } catch (error: any) {
    console.error("❌ Error in createSupportTicketAPI:", error);
    
    return {
      success: false,
      message: error.message || "Failed to create support ticket",
      errors: [error.message || "Unknown error occurred"]
    };
  }
};

// Alternative function to test attachment upload separately
export const testAttachmentUpload = async (attachment: any) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    
    const formData = new FormData();
    
    // Test minimal ticket with just attachment
    formData.append('Subject', 'Test Attachment');
    formData.append('Description', 'Testing attachment upload');
    formData.append('TicketTypeId', '1');
    
    // Add the attachment
    if (attachment.uri) {
      const fileObject = {
        uri: attachment.uri,
        name: attachment.name || 'test.jpg',
        type: attachment.type || 'image/jpeg'
      } as any;
      
      console.log("🧪 Test attachment:", fileObject);
      formData.append('Attachments', fileObject);
    }
    
    console.log("🧪 Testing attachment upload...");
    
    const response = await apiClient.post('/api/Support/createTicket', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log("🧪 Test response:", response.data);
    return response.data;
    
  } catch (error: any) {
    console.error("🧪 Test failed:", error);
    return null;
  }
};

export const getTicketTypesAPI = async (): Promise<ITicketType[]> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    const response = await apiClient.get('/api/TicketType', {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    console.log("Ticket types response:", response.data);
    
    // Check if response has the standard API structure
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    // If not, return the data directly (fallback)
    return response.data || [];
  } catch (error: any) {
    console.error("Error fetching ticket types:", error);
    return [];
  }
};

// GET /api/Support/getSupportById/{supportId}: Get support ticket details by ID
export const getSupportByIdAPI = async (supportId: string): Promise<ISupportTicket | null> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    const response = await apiClient.get(`/api/Support/getSupportById/${supportId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    console.log("Support ticket by ID response:", response.data);
    
    // Check if response has the standard API structure
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    // If not, return the data directly (fallback)
    return response.data || null;
  } catch (error: any) {
    console.error("Error fetching support ticket by ID:", error);
    return null;
  }
};

// GET /api/Support/getTicketById/{id}: Get ticket details by ID (if available)
export const getSupportTicketByIdAPI = async (id: string): Promise<ISupportTicket | null> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    const response = await apiClient.get(`/api/Support/getTicketById/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error("Error fetching support ticket:", error);
    return null;
  }
};
// REPLACE your current getPaginatedSupportTicketsAPI function with this comprehensive debug version
export const getPaginatedSupportTicketsAPI = async (
  params: ISupportTicketParams = {}
): Promise<IPaginatedSupportTickets> => {
  try {
    console.log("🚀 Starting API call with params:", params);
    
    const token = await getToken();
   
    
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
   
    
    const baseUrl = `/api/Support/getPaginatedSupportTicketsForCustomer`;
    
    
    // Make the actual request
    const response = await apiClient.get(baseUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
   
    // Check if response structure is valid
    if (!response) {
      console.error("❌ No response object received");
      throw new Error("No response received from API");
    }
    
   
    // Handle the response data
    const responseData = response.data;
    
    if (responseData === null) {
      console.log("ℹ️ API returned null - might be normal for empty results");
      return {
        data: [],
        totalCount: 0,
        pageIndex: params.pageIndex || 0,
        pageSize: params.pageSize || 10,
        totalPages: 0
      };
    }
    
    if (responseData === undefined) {
      console.error("❌ API returned undefined data");
      throw new Error("API returned undefined data");
    }
    
  
    // Handle different response formats
    if (responseData && typeof responseData === 'object') {
      // Format 1: { success: true, data: { data: [...], totalCount: N } }
      if (responseData.success && responseData.data) {
        console.log("✅ Found success + data structure");
        const ticketsContainer = responseData.data;
        const tickets = ticketsContainer.data || [];
        const totalCount = ticketsContainer.totalCount || 0;
        
        console.log("📋 Extracted tickets:", {
          ticketsCount: tickets.length,
          totalCount: totalCount,
          firstTicket: tickets[0] || 'No tickets'
        });
        
        return {
          data: tickets,
          totalCount: totalCount,
          pageIndex: params.pageIndex || 0,
          pageSize: params.pageSize || 10,
          totalPages: Math.ceil(totalCount / (params.pageSize || 10))
        };
      }
      
      // Format 2: Direct array of tickets
      if (Array.isArray(responseData)) {
        console.log("✅ Found direct array format");
        return {
          data: responseData,
          totalCount: responseData.length,
          pageIndex: params.pageIndex || 0,
          pageSize: params.pageSize || 10,
          totalPages: Math.ceil(responseData.length / (params.pageSize || 10))
        };
      }
      
      // Format 3: { data: [...], totalCount: N } (without success wrapper)
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log("✅ Found data + totalCount structure");
        return {
          data: responseData.data,
          totalCount: responseData.totalCount || responseData.data.length,
          pageIndex: params.pageIndex || 0,
          pageSize: params.pageSize || 10,
          totalPages: Math.ceil((responseData.totalCount || responseData.data.length) / (params.pageSize || 10))
        };
      }
    }
    
    console.warn("⚠️ Unrecognized response format:", responseData);
    return {
      data: [],
      totalCount: 0,
      pageIndex: params.pageIndex || 0,
      pageSize: params.pageSize || 10,
      totalPages: 0
    };
    
  } catch (error: any) {
    console.error("❌ Complete error details:", {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      hasResponse: !!error.response,
      responseStatus: error.response?.status,
      responseStatusText: error.response?.statusText,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      requestConfig: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers
      },
      networkError: error.code === 'NETWORK_ERROR',
      timeoutError: error.code === 'TIMEOUT',
      abortError: error.code === 'ABORTED'
    });
    
    return {
      data: [],
      totalCount: 0,
      pageIndex: params.pageIndex || 0,
      pageSize: params.pageSize || 10,
      totalPages: 0
    };
  }
};
export const getSupportTicketsByBookingCodeAPI = async (
  bookingCode: string,
  additionalParams?: Partial<ISupportTicketParams>
): Promise<IPaginatedSupportTickets> => {
  try {
    console.log("🔍 Searching tickets for booking code:", bookingCode);
    
    // Use existing getPaginatedSupportTicketsAPI with BookingCode filter
    const searchParams: ISupportTicketParams = {
      bookingCode: bookingCode,
      pageIndex: 0,
      pageSize: 50, // Get more results for booking detail
      ...additionalParams // Allow additional filters
    };
    
    const result = await getPaginatedSupportTicketsAPI(searchParams);
    
    console.log(`📋 Found ${result.data.length} tickets for booking ${bookingCode}`);
    
    return result;
    
  } catch (error: any) {
    console.error("❌ Error searching tickets by booking code:", error);
    return {
      data: [],
      totalCount: 0,
      pageIndex: 0,
      pageSize: 50,
      totalPages: 0
    };
  }
};


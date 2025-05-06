import { initApiClient } from "@/config/axiosConfig"; // Assuming your axiosConfig is correctly set up
// import { LogBox } from "react-native";

// Ignoring Axios 400 Errors for cleaner logs
// LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);


interface IAddContactResponse {
  success: boolean;
  message?: string;
  alreadyExists?: boolean;
  [key: string]: any; // Allows any additional properties
}

// types.ts - Create this file to centralize your type definitions

// Interface for Contact in the contact list
export interface IContact {
  contactId: number;
  contactName: string;
  message?: string;
  avatar?: string | null;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

// Interface for a message received from SignalR
export interface IMessage {
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  timestamp: string;
  files?: IMessageFile[];
  isRead?: boolean;
}

// Interface for message file attachments
export interface IMessageFile {
  fileName: string;
  contentType: string;
  base64Content?: string;
  fileUrl?: string;
}

// Interface for SignalR service
export interface ISignalRService {
  startConnection(token?: string): Promise<void>;
  stopConnection(): Promise<void>;
  sendMessage(receiverId: number, message: string, files?: any[], onProgress?: (progress: number) => void): Promise<void>;
  onMessageReceived(callback: (message: IMessage) => void): void;
  offMessageReceived(callback: Function): void;
  onMessagesRead?(callback: (receiverId: number) => void): void;
  onContactsUpdated?(callback: (contacts: IContact[]) => void): void;
}
// API to fetch all contacts
export const getContactsAPI = async (): Promise<IContact[]> => {
  const url = "/api/contact/contacts"; // Your API endpoint to get contacts
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url); // Fetching the data

    if (response && Array.isArray(response.data)) {
      return response.data; // Return the valid array of contacts
    } else {
      console.error("🔴 API Response is invalid:", response);
      return Promise.reject(new Error("Invalid response format from the server."));
    }
  } catch (error: any) {
    // Log the error for troubleshooting
    console.error("🔴 Error fetching contacts:", error);

    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }

    return Promise.reject(new Error("Failed to fetch contacts from the server."));
  }
};
// First, update the interface to match the actual API responses
interface IAddContactResponse {
  success: boolean;
  message?: string;
  errors?: string[];
}

// Improved addContactAPI that handles both successful and "already exists" cases
export const addContactAPI = async (receiverId: number): Promise<IAddContactResponse> => {
  const url = `/api/contact/add/${receiverId}`;
  
  const apiClient = await initApiClient();
  try {
    // Make POST request to the API
    const response = await apiClient.post(url);
    
    // Just return the response data directly
    return response.data;
  } catch (error: any) {
    console.log("Error in contact addition:", error.message);
    // Return a generic response instead of throwing
    return {
      success: false,
      message: "Failed to add contact"
    };
  }
};

// Clean navigateToChat implementation that doesn't show errors

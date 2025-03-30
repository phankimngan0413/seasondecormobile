import { initApiClient } from "@/config/axiosConfig";
import { LogBox } from "react-native";

// Ignoring Axios 400 Errors for cleaner logs
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

// Interface for message data
export interface IMessage {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  message: string;
  sentTime: string;
  isRead: boolean;
  files: ChatFileResponse[]; // list of files attached
}

export interface ChatFileResponse {
  fileId: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

// API to fetch all chat conversations (chat list)
export const getChatHistoryAPI = async (userId: number): Promise<IMessage[]> => {
  const url = `/api/Chat/chat-history/${userId}`; // Ensure the correct endpoint with userId
  
  console.log("🔍 Fetching chat history for userId:", userId); // Log userId for debugging
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get<IMessage[]>(url);
    console.log("🟢 Full API Response:", response.data); // Log full response for debugging
    
    // Check if the response contains valid data
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Filter messages where the user is either the sender or the receiver
      const filteredMessages = response.data.filter(
        (message) => message.senderId === userId || message.receiverId === userId
      );
      
      return filteredMessages; // Return the filtered chat messages
    } else {
      // Trả về mảng rỗng thay vì báo lỗi
      return [];
    }
  } catch (error: any) {
    console.error("🔴 Error fetching chat history:", error);
    // Trả về mảng rỗng thay vì ném lỗi
    return [];
  }
};

export const getUnreadMessagesAPI = async (): Promise<IMessage[]> => {
  const url = `/api/Chat/unread-messages`; // API endpoint để lấy tin nhắn chưa đọc
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get<IMessage[]>(url);
    console.log("🟢 Full API Response:", response.data);
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data; // Trả về danh sách tin nhắn chưa đọc
    }
    
    console.error("🔴 API Response is invalid or empty:", response.data);
    return Promise.reject(new Error("Invalid response from server."));
  } catch (error: any) {
    console.error("🔴 Error fetching unread messages:", error);
    return Promise.reject(new Error("Failed to fetch unread messages from the server."));
  }
};
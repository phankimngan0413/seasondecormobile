import * as signalR from "@microsoft/signalr";
import { getToken, getUserIdFromToken } from "./auth";  // Giả sử bạn đã có các helper để lấy token và userId
import { BASE_URL } from "@/config/apiConfig";  // Đảm bảo rằng bạn đã cấu hình đúng BASE_URL

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  // Phương thức khởi tạo kết nối SignalR
  public async startConnection(token: string): Promise<void> {
    // Prevent connecting if already connected
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      console.log("Already connected to SignalR");
      return;
    }

    try {
      // Cấu hình kết nối SignalR
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${BASE_URL}/chatHub`, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
          accessTokenFactory: () => token, // Sử dụng token để xác thực
        })
        .withAutomaticReconnect() // Tự động reconnect nếu mất kết nối
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Xử lý khi nhận tin nhắn
      this.connection.on("ReceiveMessage", (message) => {
        console.log("Message received:", message);
        const callbacks = this.callbacks.get("messageReceived") || [];
        callbacks.forEach((callback) => callback(message)); // Gọi các callback đã đăng ký
      });

      // Xử lý lỗi kết nối
      this.connection.onclose((error) => {
        console.log("SignalR connection closed:", error);
        this.connection = null;
        if (error) {
          setTimeout(() => this.startConnection(token), 5000); // Thử reconnect sau 5 giây
        }
      });

      // Khởi tạo kết nối
      await this.connection.start();
      console.log("SignalR connected successfully.");
    } catch (error) {
      console.error("Error starting SignalR connection:", error);
      this.connection = null;
      throw error;
    }
  }

  // Phương thức dừng kết nối SignalR
  public async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log("SignalR connection stopped.");
        this.connection = null;
      } catch (error) {
        console.error("Error stopping SignalR connection:", error);
      }
    }
  }

  // Phương thức gửi tin nhắn
  public async sendMessage(receiverId: number, message: string, files: any[] = [], onProgress?: (progress: number) => void): Promise<void> {
    console.log("Attempting to send message...");

    const senderId = await getUserIdFromToken();  // Lấy senderId từ token (tự động lấy trên backend)
    console.log(`Sending message to SignalR: Sender ID = ${senderId}, Receiver ID = ${receiverId}`);

    if (senderId === receiverId) {
      console.error("You cannot send a message to yourself.");
      return;
    }

    // Kiểm tra kết nối SignalR trước khi gửi tin nhắn
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.error("SignalR connection is not established. Attempting to reconnect...");
      try {
        const token = await getToken();  // Lấy token để reconnect
        if (token) {
          await this.startConnection(token);  // Kết nối lại với token hiện tại
          console.log("SignalR connected successfully.");
        } else {
          console.error("Failed to retrieve token.");
          return;  // Thoát nếu không có token
        }
      } catch (error) {
        console.error("Error reconnecting to SignalR:", error);
        return;  // Thoát nếu không thể reconnect
      }
    }

    // Chuẩn bị tệp tin nếu có
    const fileData = files.map((file) => ({
      FileName: file.name,
      ContentType: file.type,
      Base64Content: file.base64Content,
    }));

    try {
      // Gửi tin nhắn qua SignalR
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke("SendMessage", receiverId, message, fileData);
        console.log("Message sent successfully.");
      } else {
        console.error("SignalR connection is still not established.");
      }

      // Nếu có callback, hoàn tất tiến độ
      if (onProgress) {
        onProgress(100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  // Đăng ký callback cho khi nhận tin nhắn
  public onMessageReceived(callback: Function): void {
    const callbacks = this.callbacks.get("messageReceived") || [];
    this.callbacks.set("messageReceived", [...callbacks, callback]);
  }

  // Các phương thức hủy đăng ký callback nếu không còn cần thiết
  public offMessageReceived(callback: Function): void {
    const callbacks = this.callbacks.get("messageReceived") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("messageReceived", callbacks);
    }
  }
  public onMessagesRead(callback: (receiverId: number) => void): void {
    this.callbacks.set("messagesRead", [callback]);
    this.connection?.on("MessagesRead", (receiverId: number) => {
      callback(receiverId);  // Call the callback function when messages are read
    });
  }

  // Listen for contact updates
  public onContactsUpdated(callback: (contacts: any[]) => void): void {
    this.callbacks.set("contactsUpdated", [callback]);
    this.connection?.on("ContactsUpdated", (contacts: any[]) => {
      callback(contacts);  // Call the callback function with the updated contacts
    });
  }
}

export const signalRService = new SignalRService();  // Xuất đối tượng SignalRService


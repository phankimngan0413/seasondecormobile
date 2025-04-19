import { initApiClient } from "@/config/axiosConfig";
import { random } from "lodash";

export interface ISeason {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  description: string;
}

export interface ISeasonResponse {
  success: boolean;
  season: ISeason;
  message?: string;
}

export interface ISeasonsListResponse {
  success: boolean;
  seasons: ISeason[];
  totalCount: number;
  message?: string;
}

export interface ICreateSeasonRequest {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface IUpdateSeasonRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'upcoming' | 'completed';
  description?: string;
}

// Server response types
export interface IServerSeason {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
}

export interface IServerResponse {
  success: boolean;
  message: string;
  errors: any[];
  data: IServerSeason | IServerSeason[];
}

/**
 * Map server season format to client format
 */
function mapSeason(season: IServerSeason): ISeason {
  return {
    id: season.id,
    name: season.name,
    startDate: season.startDate,
    endDate: season.endDate,
    status: season.status as 'active' | 'upcoming' | 'completed',
    description: season.description
  };
}

export const getSeasonsAPI = async (): Promise<ISeasonsListResponse> => {
  const url = "/api/Season";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        const seasons = response.data.map(mapSeason);
        return {
          success: true,
          seasons,
          totalCount: seasons.length,
          message: "Seasons retrieved successfully"
        };
      }
      
      if (response.data.success && Array.isArray(response.data.data)) {
        const seasons = response.data.data.map(mapSeason);
        return {
          success: true,
          seasons,
          totalCount: seasons.length,
          message: response.data.message || "Seasons retrieved successfully"
        };
      }
    }
    
    console.log("Invalid seasons response:", response);
    return {
      success: false,
      seasons: [],
      totalCount: 0,
      message: "Failed to retrieve seasons information"
    };
  } catch (error: any) {
    console.log("Error fetching seasons:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      seasons: [],
      totalCount: 0,
      message: "Failed to connect to season service"
    };
  }
};

export const getSeasonByIdAPI = async (id: number): Promise<ISeasonResponse> => {
  const url = `/api/Season/${id}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    if (response && response.data) {
      if (response.data.id) {
        return {
          success: true,
          season: mapSeason(response.data),
          message: "Season retrieved successfully"
        };
      }
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          season: mapSeason(response.data.data),
          message: response.data.message || "Season retrieved successfully"
        };
      }
    }
    
    console.log("Invalid season response:", response);
    return {
      success: false,
      season: {
        id: 0,
        name: "",
        startDate: "",
        endDate: "",
        status: "completed",
        description: ""
      },
      message: "Failed to retrieve season information"
    };
  } catch (error: any) {
    console.log("Error fetching season:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      season: {
        id: 0,
        name: "",
        startDate: "",
        endDate: "",
        status: "completed",
        description: ""
      },
      message: "Failed to connect to season service"
    };
  }
};

export const createSeasonAPI = async (seasonData: ICreateSeasonRequest): Promise<ISeasonResponse> => {
  const url = "/api/Season";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.post(url, seasonData);
    
    if (response && response.data) {
      if (response.data.id) {
        return {
          success: true,
          season: mapSeason(response.data),
          message: "Season created successfully"
        };
      }
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          season: mapSeason(response.data.data),
          message: response.data.message || "Season created successfully"
        };
      }
    }
    
    console.log("Invalid season creation response:", response);
    return {
      success: false,
      season: {
        id: 0,
        name: "",
        startDate: "",
        endDate: "",
        status: "completed",
        description: ""
      },
      message: "Failed to create season"
    };
  } catch (error: any) {
    console.log("Error creating season:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      season: {
        id: 0,
        name: "",
        startDate: "",
        endDate: "",
        status: "completed",
        description: ""
      },
      message: "Failed to connect to season service"
    };
  }
};


export const updateSeasonAPI = async (id: number, seasonData: IUpdateSeasonRequest): Promise<ISeasonResponse> => {
  const url = `/api/Season/${id}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.put(url, seasonData);
    
    if (response && response.data) {
      if (response.data.id) {
        return {
          success: true,
          season: mapSeason(response.data),
          message: "Season updated successfully"
        };
      }
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          season: mapSeason(response.data.data),
          message: response.data.message || "Season updated successfully"
        };
      }
    }
    
    console.log("Invalid season update response:", response);
    return {
      success: false,
      season: {
        id: 0,
        name: "",
        startDate: "",
        endDate: "",
        status: "completed",
        description: ""
      },
      message: "Failed to update season"
    };
  } catch (error: any) {
    console.log("Error updating season:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      season: {
        id: 0,
        name: "",
        startDate: "",
        endDate: "",
        status: "completed",
        description: ""
      },
      message: "Failed to connect to season service"
    };
  }
};

export const deleteSeasonAPI = async (id: number): Promise<{success: boolean, message: string}> => {
  const url = `/api/Season/${id}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.delete(url);
    
    if (response && response.data) {
      if (response.data.success !== undefined) {
        return {
          success: response.data.success,
          message: response.data.message || "Season deleted successfully"
        };
      }
            return {
        success: true,
        message: "Season deleted successfully"
      };
    }
    
    console.log("Invalid season deletion response:", response);
    return {
      success: false,
      message: "Failed to delete season"
    };
  } catch (error: any) {
    console.log("Error deleting season:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: "Failed to connect to season service"
    };
  }
};

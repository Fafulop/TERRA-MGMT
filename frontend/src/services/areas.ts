export interface Area {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Subarea {
  id: number;
  area_id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AreaWithSubareas extends Area {
  subareas: Subarea[];
}

export interface AreaFormData {
  name: string;
  description?: string;
}

export interface SubareaFormData {
  area_id: number;
  name: string;
  description?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const areasService = {
  // Get all areas with their subareas
  getAreas: async (token: string): Promise<AreaWithSubareas[]> => {
    const response = await fetch(`${API_BASE_URL}/areas`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch areas');
    }

    const result = await response.json();
    return result.areas;
  },

  // Get a specific area by ID with its subareas
  getAreaById: async (areaId: number, token: string): Promise<AreaWithSubareas> => {
    const response = await fetch(`${API_BASE_URL}/areas/${areaId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch area');
    }

    const result = await response.json();
    return result.area;
  },

  // Create a new area
  createArea: async (areaData: AreaFormData, token: string): Promise<AreaWithSubareas> => {
    const response = await fetch(`${API_BASE_URL}/areas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(areaData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create area');
    }

    const result = await response.json();
    return result.area;
  },

  // Update an existing area
  updateArea: async (areaId: number, areaData: AreaFormData, token: string): Promise<Area> => {
    const response = await fetch(`${API_BASE_URL}/areas/${areaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(areaData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update area');
    }

    const result = await response.json();
    return result.area;
  },

  // Delete an area
  deleteArea: async (areaId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/areas/${areaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete area');
    }
  },

  // Create a new subarea
  createSubarea: async (subareaData: SubareaFormData, token: string): Promise<Subarea> => {
    const response = await fetch(`${API_BASE_URL}/areas/subareas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subareaData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create subarea');
    }

    const result = await response.json();
    return result.subarea;
  },

  // Update an existing subarea
  updateSubarea: async (subareaId: number, subareaData: SubareaFormData, token: string): Promise<Subarea> => {
    const response = await fetch(`${API_BASE_URL}/areas/subareas/${subareaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subareaData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update subarea');
    }

    const result = await response.json();
    return result.subarea;
  },

  // Delete a subarea
  deleteSubarea: async (subareaId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/areas/subareas/${subareaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete subarea');
    }
  }
};
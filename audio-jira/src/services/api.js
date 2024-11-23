const API_BASE_URL = "http://localhost:3000/api";

export const uploadAudio = async (file) => {
  const formData = new FormData();
  formData.append("audio", file);

  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw error;
  }
};

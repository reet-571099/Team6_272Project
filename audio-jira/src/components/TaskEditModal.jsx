import React, { useState } from "react";
import { Edit2, X, Check } from "lucide-react";
import axios from "axios";

const TaskEditModal = ({ story, isOpen, onClose, onSave }) => {
  const [editedStory, setEditedStory] = useState(story);

  const handleChange = (field, value) => {
    setEditedStory((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  const handleSave = async () => {
    const updatedStory = {
      ...story,
      story_name: editedStory.story_name,
      description: editedStory.description,
      story_points: parseInt(editedStory.story_points, 10),
      project_id: editedStory.project_id,
    };

    try {
      const response = await axios.put(
        `http://localhost:3001/api/stories/${story.story_id}/${editedStory.project_id}`,
        updatedStory,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Story updated successfully:", response.data);

      onSave(updatedStory);
      onClose();
    } catch (error) {
      console.error("Failed to update story:", error);
      alert("An error occurred while saving the changes. Please try again.");
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Edit2 className="mr-2 h-5 w-5 text-indigo-600" />
            Edit Story
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Story Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Story Name
            </label>
            <input
              type="text"
              value={editedStory.story_name}
              onChange={(e) => handleChange("story_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter story name"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editedStory.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter story description"
              rows="5"
            />
          </div>

          {/* Story Points Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Story Points
            </label>
            <select
              value={editedStory.story_points}
              onChange={(e) => handleChange("story_points", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[1, 2, 3, 4, 5, 8, 13].map((points) => (
                <option key={points} value={points}>
                  {points}
                </option>
              ))}
            </select>
          </div>

          {/* Project ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project ID
            </label>
            <input
              type="text"
              value={editedStory.project_id}
              onChange={(e) => handleChange("project_id", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter project ID"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskEditModal;
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaskEditModal from "../components/TaskEditModal";
import {
  Upload,
  Edit2,
  Check,
} from "lucide-react";
import { useLocation } from 'react-router-dom';

const TaskCard = ({ task, onEdit, onConfirm, onCancel, isLoading }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (editedTask) => {
    onEdit(editedTask);
  };

  const handleConfirm = () => {
    onConfirm(task);
    setIsConfirmed(true);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: isConfirmed ? 0.7 : 1,
          scale: isConfirmed ? 1.05 : 1,
        }}
        transition={{
          duration: 0.3,
          type: "spring",
          stiffness: 200,
        }}
        className={`relative p-6 rounded-xl transition-all 
          ${isConfirmed ? "bg-green-50" : "bg-white hover:bg-gray-50"} 
          shadow-lg border border-gray-100`}
      >
        {/* Animated Check Mark */}
        <AnimatePresence>
          {isConfirmed && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="absolute inset-0 flex items-center justify-center z-10"
            >
              <div className="bg-green-500 text-white rounded-full p-4 shadow-xl">
                <Check className="h-12 w-12" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
  
        <div className="space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <h4
                className={`text-sm font-semibold ${
                  isConfirmed ? "text-green-800 opacity-70" : "text-gray-900"
                }`}
              >
                {task.story_name}
              </h4>
            </div>
  
            {!isConfirmed && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEdit}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          <div
            className={`text-xs mt-1 space-y-1 ${
              isConfirmed ? "text-green-700 opacity-70" : "text-gray-500"
            }`}
          >
            {/* {task.description.map((desc, index) => (
              <p key={index}>{desc}</p>
            ))} */}
            <p>{task.description}</p>
          </div>
  
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium 
                ${
                  isConfirmed
                    ? "bg-green-100 text-green-800 opacity-70"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {isConfirmed ? "Created in Jira" : `${task.story_points} Story Points`}
              </div>
              <div className="text-xs text-gray-500">{task.project_id}</div>
            </div>
  
            {!isConfirmed && (
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`text-indigo-600 hover:text-indigo-700 font-medium flex items-center 
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Create in Jira
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
  
      {/* Task Edit Modal */}
      <TaskEditModal
        story={task}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
      />
    </>
  );
};

const TasksView = ({ project, tasks, onBack }) => {
  const [updatedTasks, setUpdatedTasks] = useState(tasks);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditTask = (editedTask) => {
    setUpdatedTasks((prev) =>
      prev.map((task) => (task.id === editedTask.id ? editedTask : task))
    );
  };

  const handleConfirmTask = async (confirmedTask) => {
    try {
      // Start loading state
      setIsLoading(true);
  
      // Retrieve username from localStorage
      const username = localStorage.getItem('username') || 'nikhilkoli287@gmail.com';
  
      // Validate payload before sending
      if (!confirmedTask.story_id || !confirmedTask.project_id) {
        throw new Error('Missing required task information');
      }
  
      // Prepare the payload for the API
      const payload = {
        "story_id": confirmedTask.story_id,
        "project_id": confirmedTask.project_id,
        "userId": username
      };
  
      // Extensive logging
      console.log('Full Task Details:', confirmedTask);
      console.log('Jira Push Payload:', JSON.stringify(payload, null, 2));
      console.log('Username:', username);
  
      try {
        // Make the API call to create Jira story
        const response = await fetch('http://54.193.65.42:3000/api/pushToJIRA', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
  
        // Log raw response
        const responseText = await response.text();
        console.log('Raw Response Status:', response.status);
        console.log('Raw Response Text:', responseText);
  
        // Try to parse response
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('Parsed Response:', responseData);
        } catch (parseError) {
          console.error('JSON Parsing Error:', parseError);
          throw new Error(`Failed to parse response: ${responseText}`);
        }
  
        // Validate response structure
        if (!responseData || !responseData.jiraResponse) {
          throw new Error('Invalid response structure: ' + JSON.stringify(responseData));
        }
  
        // Update the task's status locally to reflect successful creation
        setUpdatedTasks((prev) =>
          prev.map((task) =>
            task.id === confirmedTask.id 
              ? { 
                  ...task, 
                  isConfirmed: true, 
                  jiraKey: responseData.jiraResponse.story_key
                } 
              : task
          )
        );
  
        // Success notification
        alert(`Jira story created successfully: ${responseData.jiraResponse.story_key}`);
        
      } catch (fetchError) {
        console.error('Fetch Error Details:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        });
  
        // More specific error handling
        if (fetchError.name === 'TypeError') {
          alert('Network error. Please check your internet connection.');
        } else {
          alert(`API Call Error: ${fetchError.message}`);
        }
      }
    } catch (error) {
      // Catch-all error handling
      console.error('Unexpected Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
  
      alert(`Unexpected error: ${error.message}`);
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
          <p className="text-gray-500">AI Generated Tasks</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {updatedTasks?.map((task) => (
            <TaskCard
              key={task.story_id}
              task={task}
              onEdit={handleEditTask}
              onConfirm={handleConfirmTask}
              onCancel={() => {}}
              isLoading={isLoading}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const TasksPage = () => {
  const location = useLocation();
  const tasks = location.state?.tasks || [];
  const project = location.state?.project || {};

  console.log({ tasks });

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="py-6 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TasksView
            tasks={tasks}
            project={project}
          />
        </div>
      </div>

    </div>
  );
};

export default TasksPage;
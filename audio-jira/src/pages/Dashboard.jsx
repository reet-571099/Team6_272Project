import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TaskEditModal from "../components/TaskEditModal";
import JiraIntegrationModal from "../components/JiraIntegrationModal";
import {
  Menu,
  Bell,
  User,
  Plus,
  Mic2,
  Upload,
  Edit2,
  Check,
  X,
} from "lucide-react";

// Remove mock projects, this will be replaced with API call
const ProjectSelectionView = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Retrieve username from localStorage or your auth context
        const username = localStorage.getItem('username') || 'nikhilkoli287@gmail.com';
        
        const response = await fetch(
          `http://18.222.152.111:5001/get_all_project_keys?username=${encodeURIComponent(username)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        
        // Map the API response to match your existing project structure
        const formattedProjects = data.projects.map(project => ({
          id: project.key,
          name: project.key,
          description: `Project Description: ${project.name}`, // You can customize this
          totalTasks: project.story_count, // You might want to fetch this separately project.story_count
          key: project.key
        }));

        setProjects(formattedProjects);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        <p>Error loading projects: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Select a Project</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onProjectSelect(project)}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                {project.name}
              </h3>
              <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm">
                {project.totalTasks} Tasks
              </div>
            </div>
            <p className="text-gray-500 mb-4">{project.description}</p>
            <div className="flex items-center text-indigo-600 hover:text-indigo-700">
              <Plus className="mr-2 h-5 w-5" />
              Create Tasks
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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

  // Extract description text
  const descriptionText =
    task.description?.content?.[0]?.content?.[0]?.text || "No description";

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

        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <h4
                className={`text-sm font-semibold ${
                  isConfirmed ? "text-green-800 opacity-70" : "text-gray-900"
                }`}
              >
                {task.summary}
              </h4>
              <p
                className={`text-xs mt-1 ${
                  isConfirmed ? "text-green-700 opacity-70" : "text-gray-500"
                }`}
              >
                {descriptionText}
              </p>
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
                {isConfirmed ? "Created in Jira" : task.priority.name}
              </div>
              <div className="text-xs text-gray-500">{task.issuetype}</div>
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
        task={task}
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

      // Prepare the payload for the API
      const payload = {
        project_key: confirmedTask.project_key,
        summary: confirmedTask.summary,
        issuetype: confirmedTask.issuetype || "Story", 
        description: confirmedTask.description?.content?.[0]?.content?.[0]?.text || "",
        assignee: confirmedTask.assignee?.id || username,
        labels: ["AI-Generated"],
        priority: confirmedTask.priority?.name ? { name: confirmedTask.priority.name } : "Low",
      };

      // Make the API call to create Jira story
      const response = await fetch(
        `http://18.222.152.111:5001/create_jira_story?username=${encodeURIComponent(username)}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      console.log(payload)

      if (!response.ok) {
        // Handle error response
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create Jira story');
      }

      // Parse the successful response
      const responseData = await response.json();

      // Update the task's status locally to reflect successful creation
      setUpdatedTasks((prev) =>
        prev.map((task) =>
          task.id === confirmedTask.id 
            ? { 
                ...task, 
                isConfirmed: true, 
                jiraKey: responseData.key // Assuming the API returns the Jira issue key
              } 
            : task
        )
      );
      alert(`Jira story created successfully!}`);
      // Optional: Show a success toast or notification
      console.log('Jira story created successfully:', responseData);
    } catch (error) {
      // Handle any errors during the API call
      console.error('Error creating Jira story:', error);
      
      // Show an error notification to the user
      alert(`Failed to create Jira story: ${error.message}`);
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500">AI Generated Tasks</p>
        </div>
        <button
          onClick={onBack}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Back to Projects
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {updatedTasks.map((task) => (
            <TaskCard
              key={task.id}
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

const AudioUploadView = ({ project, onFileUpload, onBack }) => (
  <div>
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-gray-500">Upload audio to generate tasks</p>
      </div>
      <button
        onClick={onBack}
        className="text-indigo-600 hover:text-indigo-700 font-medium"
      >
        Back to Projects
      </button>
    </div>

    <div className="bg-white shadow-lg rounded-xl p-8 text-center">
      <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Upload className="h-8 w-8 text-indigo-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Upload Audio File
      </h3>
      <p className="text-gray-500 mb-6">
        Select an audio file to generate tasks for {project.name}
      </p>

      <label className="inline-block w-full max-w-md">
        <input
          type="file"
          className="hidden"
          accept="audio/*"
          onChange={onFileUpload}
        />
        <span className="w-full inline-flex justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-4 bg-white text-base font-medium text-gray-700 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-colors">
          <Upload className="mr-2 h-5 w-5" />
          Choose Audio File
        </span>
      </label>
    </div>
  </div>
);

const Dashboard = () => {
  const [currentView, setCurrentView] = useState("projects");
  const [selectedProject, setSelectedProject] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const navigate = useNavigate();
  
  // Add state for Jira modal
  const [showJiraModal, setShowJiraModal] = useState(() => {
    const hasSeenModal = localStorage.getItem('hasSeenJiraModal');
    return !hasSeenModal;
  });

  const handleJiraIntegrationComplete = (formData) => {
    console.log('Jira Integration Data:', formData);
    // Save the Jira credentials and handle the integration
    localStorage.setItem('hasSeenJiraModal', 'true');
    localStorage.setItem('jiraConfig', JSON.stringify(formData));
    setShowJiraModal(false);
  };

  const handleJiraIntegrationSkip = () => {
    localStorage.setItem('hasSeenJiraModal', 'true');
    setShowJiraModal(false);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setCurrentView("audio");
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAudioFiles = files.map((file) => ({
      id: Date.now(),
      name: file.name,
      status: "processing",
      file,
    }));

    setAudioFiles(newAudioFiles);

    // Simulate AI task generation
    setTimeout(() => {
      const mockTasks = [
        {
          id: 1,
          project_key: selectedProject.key,
          summary: "This is a test to check assignee",
          issuetype: "Task",
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "DESC low priority assignee check1",
                  },
                ],
              },
            ],
          },
          priority: { name: "Low" },
          assignee: { id: "reet.khanchandani@sjsu.edu" },
        },
        {
          id: 2,
          project_key: selectedProject.key,
          summary: "UI backend integration for create jira ",
          issuetype: "Story",
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "I hope this works ",
                  },
                ],
              },
            ],
          },
          priority: { name: "Low" },
          assignee: { id: "nikhilkoli287@gmail.com" },
        },
      ];

      setGeneratedTasks(mockTasks);
      setCurrentView("tasks");
    }, 2000);
  };

  const renderContent = () => {
    switch (currentView) {
      case "projects":
        return <ProjectSelectionView onProjectSelect={handleProjectSelect} />;
      case "audio":
        return (
          <AudioUploadView
            project={selectedProject}
            onFileUpload={handleFileUpload}
            onBack={() => setCurrentView("projects")}
          />
        );
      case "tasks":
        return (
          <TasksView
            project={selectedProject}
            tasks={generatedTasks}
            onBack={() => setCurrentView("projects")}
          />
        );
        default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add the JiraIntegrationModal */}
      {showJiraModal && (
        <JiraIntegrationModal
          onComplete={handleJiraIntegrationComplete}
          onSkip={handleJiraIntegrationSkip}
        />
      )}
      
      <div className="py-6 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

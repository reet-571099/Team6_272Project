import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JiraIntegrationModal from "../components/JiraIntegrationModal";
import axios from 'axios';
import {
  Plus,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Project Tasks View Component
const ProjectTasksView = ({ project, onBack }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectTasks = async () => {
      try {
        const username = localStorage.getItem('username') || 'nikhilkoli287@gmail.com';
        
        const response = await fetch(
          `http://18.222.152.111:5001/get_all_issues_in_project?username=${encodeURIComponent(username)}&project_key=${encodeURIComponent(project.key)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch project tasks');
        }

        const data = await response.json();
        
        if (data.status === 'success') {
          setTasks(data.issues);
        } else {
          throw new Error('Failed to fetch tasks');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching project tasks:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProjectTasks();
  }, [project.key]);

  // TaskCard component remains the same as in the previous implementation
  const TaskCard = ({ task }) => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.3,
          type: "spring",
          stiffness: 200,
        }}
        className="bg-white rounded-xl shadow-lg p-6 hover:bg-gray-50 transition-all"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <h4 className="text-sm font-semibold text-gray-900">
                {task.summary}
              </h4>
              <p className="text-xs mt-1 text-gray-500">
                Key: {task.key}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium 
                ${
                  task.status === "To Do"
                    ? "bg-blue-100 text-blue-800"
                    : task.status === "In Progress"
                    ? "bg-yellow-100 text-yellow-800"
                    : task.status === "Done"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {task.status}
              </div>
              <div className="text-xs text-gray-500">{task.assignee}</div>
            </div>

            <div className="text-xs text-gray-500">
              {formatDate(task.created)}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">Loading tasks...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        <p>Error loading tasks: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500">Project Tasks</p>
        </div>
        <button
          onClick={onBack}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Back to Projects
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No tasks found for this project.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {tasks.map((task) => (
              <TaskCard
                key={task.key}
                task={task}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// Project Selection View Component
const ProjectSelectionView = ({ onProjectSelect, onViewTasks }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const username = localStorage.getItem('username') ;  
        console.log(username);
        const response = await fetch(
          `http://18.222.152.111:5001/get_all_project_keys?username=${(username)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        
        const formattedProjects = data.projects.map(project => ({
          id: project.key,
          name: project.key,
          description: `Project Description: ${project.name}`,
          totalTasks: project.story_count,
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
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                {project.name}
              </h3>
              <div 
                onClick={() => onViewTasks(project)}
                className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-indigo-100"
              >
                {project.totalTasks} Tasks
              </div>
            </div>
            <div className="flex space-x-4">
              <div 
                onClick={() => onProjectSelect(project)}
                className="flex-grow cursor-pointer"
              >
                <p className="text-gray-500 mb-4">{project.description}</p>
                <div className="flex items-center text-indigo-600 hover:text-indigo-700">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Tasks
                </div>
              </div>
            </div>
          </div>
        ))}
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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const [showJiraModal, setShowJiraModal] = useState(() => {
    // Check if Jira integration is validated in localStorage
    
    const cookie = document.cookie.split('; ');
        console.log({cookie: cookie})
        const userDetailsFromCookies = cookie.find(row => row.startsWith('user_obj='));
        if(userDetailsFromCookies)
        {
          const decodedUserObj = decodeURIComponent(userDetailsFromCookies);
          console.log("decoded userObj: ", decodedUserObj);
          const userObject = JSON.parse(decodedUserObj.split('=')[1]);
          const email = userObject.email; 
          const id = userObject.id; 
          const validated = userObject.validated;
          console.log(email);
          console.log(id);
          localStorage.setItem("userId",id);
          localStorage.setItem("username",email);
          localStorage.setItem("validated",validated);
        }
    const isValidated = localStorage.getItem('validated');
    // Return false (don't show modal) if 'validated' is 'true'
    return isValidated !== 'true';
  });

  const handleJiraIntegrationComplete = (formData) => {
    console.log('Jira Integration Data:', formData);
    
    // Set 'validated' to 'true' in localStorage
    localStorage.setItem('validated', 'true');
    localStorage.setItem('jiraConfig', JSON.stringify(formData));
    
    setShowJiraModal(false);
  };
  
  const handleJiraIntegrationSkip = () => {
    // Set 'validated' to 'true' to prevent future modal displays
    localStorage.setItem('validated', 'true');
    setShowJiraModal(false);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setCurrentView("audio");
  };

  const handleViewTasks = (project) => {
    setSelectedProject(project);
    setCurrentView("project-tasks");
  };

  const pollActiveStories = async (userId, projectId) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/getActiveStories`, {
        params: {
          user_id: userId,
          project_id: projectId
        }
      });
      
      return response.data.activeStories;
    } catch (error) {
      console.error('Error polling active stories:', error);
      return 0;
    }
  };
  
  const fetchStories = async (projectId) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/stories/${projectId}`);
      
      navigate('/tasks', { state: { tasks: response.data.stories, project: selectedProject }});
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    // Log that the file upload event was triggered
    console.log('File upload event triggered');
    
    const files = Array.from(event.target.files);
    
    // Log the selected files
    console.log('Selected files:', files);
    
    // Validate file selection
    if (files.length === 0) {
      console.error('No files selected');
      alert('Please select an audio file');
      return;
    }
  
    try {
     
      let token = localStorage.getItem("jwt");
  
  
      // Validate token
      if (!token) {
        const cookie = document.cookie.split('; ');
        console.log({cookie: cookie})
        const jwtCookie = cookie.find(row => row.startsWith('jwt='));
      if (jwtCookie) {
        token = jwtCookie.split('=')[1];
        console.log('JWT Token found in cookies:', !!token);
      }
      else{
        throw new Error('No JWT token found in cookies. Please log in again.');
      }
        
      }
  
      // Validate selected project
      if (!selectedProject || !selectedProject.key) {
        console.error('No project selected');
        alert('Please select a project first');
        return;
      }
  
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('audio_file', files[0]); // Assuming single file upload
      formData.append('project_id', selectedProject.key);


      setIsLoading(true);

      const response = await axios.post('http://54.193.65.42:8000/api/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

     // If upload is successful, start polling
      const userid= localStorage.getItem("id") || localStorage.getItem("userId");
      console.log(userid);
      if (response.status === 200) {
        const pollInterval = setInterval(async () => {
          const activeStoriesCount = await pollActiveStories(userid, selectedProject.key);
          
          if (activeStoriesCount > 0) {
            clearInterval(pollInterval);
            await fetchStories(selectedProject.key);
          }
        }, 10000); // Poll every 10 seconds
       }

    } catch (error) {
      console.error('Unexpected error:', error);
      setIsLoading(false);
      alert(`Error processing file: ${error.message}`);
    }
  };
  
  const renderContent = () => {
    switch (currentView) {
      case "projects":
        return <ProjectSelectionView 
          onProjectSelect={handleProjectSelect} 
          onViewTasks={handleViewTasks}
        />;
      case "audio":
        return (
          <AudioUploadView
            project={selectedProject}
            onFileUpload={handleFileUpload}
            onBack={() => setCurrentView("projects")}
          />
        );
      case "project-tasks":
        return (
          <ProjectTasksView
            project={selectedProject}
            onBack={() => setCurrentView("projects")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 flex-col">
          <div className="w-16 h-16 border-4 border-t-4 border-blue-500 border-opacity-25 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
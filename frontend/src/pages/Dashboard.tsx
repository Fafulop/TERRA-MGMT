import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FileUpload from '../components/FileUpload';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to continue</h1>
          <a href="/login" className="text-blue-600 hover:text-blue-800">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.username}!</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Task Management Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">
                  Your Tasks
                </h2>
                <button
                  onClick={() => navigate('/tasks')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  View My Tasks
                </button>
              </div>
              <p className="text-gray-500">Click "View My Tasks" to see all your tasks and create new ones!</p>
            </div>

            {/* File Upload Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                File Uploads
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Upload Images</h3>
                  <FileUpload 
                    uploaderType="imageUploader"
                    variant="button"
                    onUploadComplete={(files) => {
                      console.log('Images uploaded:', files);
                      alert(`Successfully uploaded ${files.length} image(s)!`);
                    }}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Upload PDFs</h3>
                  <FileUpload 
                    uploaderType="pdfUploader"
                    variant="button"
                    onUploadComplete={(files) => {
                      console.log('PDFs uploaded:', files);
                      alert(`Successfully uploaded ${files.length} PDF(s)!`);
                    }}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Drag & Drop Zone (Images)</h3>
                  <FileUpload 
                    uploaderType="imageUploader"
                    variant="dropzone"
                    onUploadComplete={(files) => {
                      console.log('Files uploaded via dropzone:', files);
                      alert(`Successfully uploaded ${files.length} file(s)!`);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
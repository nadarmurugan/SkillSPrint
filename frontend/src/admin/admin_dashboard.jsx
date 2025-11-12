// src/admin/AdminDashboard.jsx - COMPLETELY REWRITTEN & ENHANCED VERSION

import React, { useState, useEffect, useMemo, useCallback } from 'react';
const useNavigate = () => (path, options) => console.log(`Navigating to: ${path}, Options: ${JSON.stringify(options)}`);
import { v4 as uuidv4 } from 'uuid'; 
import ReflectionManagement from './ReflectionManagement';

// --- API Configuration ---
const API_BASE_URL = 'http://localhost:5050/api';
const LESSON_API_URL = `${API_BASE_URL}/lessons`;
const CATEGORIES_API_URL = `${API_BASE_URL}/categories`;

// --- API Interaction Functions for Sprints ---
const fetchSprintsApi = async () => {
    const response = await fetch(`${API_BASE_URL}/sprints`);
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to fetch sprints from server.");
    }
    const data = await response.json();
    return data;
};

const createSprintApi = async (sprintData) => {
    const response = await fetch(`${API_BASE_URL}/sprints`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: sprintData.title,
            description: sprintData.description,
            video_url: sprintData.videoUrl, 
            max_duration_minutes: sprintData.maxDurationMinutes,
            thumbnail_url: sprintData.thumbnailUrl, 
        }),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to create sprint via API.");
    }
    return response.json(); 
};

const deleteSprintApi = async (sprintId) => {
    const response = await fetch(`${API_BASE_URL}/sprints/${sprintId}`, {
        method: 'DELETE',
    });
    if (response.status !== 204 && response.status !== 200) {
        throw new Error("Failed to delete sprint via API.");
    }
    return true; 
};

const updateSprintStatusApi = async (sprintId, shouldActivate) => {
    const response = await fetch(`${API_BASE_URL}/sprints/${sprintId}/active`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shouldActivate }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to update sprint status via API.");
    }
    return response.json(); 
};

// --- API Interaction Functions for Categories ---
const fetchCategoriesApi = async () => {
    const res = await fetch(CATEGORIES_API_URL);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch categories.");
    if (!Array.isArray(data)) throw new Error("Invalid data format from API");
    return data;
};

const createCategoryApi = async (name) => {
    const res = await fetch(CATEGORIES_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create category.");
    return data;
};

const deleteCategoryApi = async (id) => {
    const res = await fetch(`${CATEGORIES_API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete category.");
    return true;
};

// --- API Interaction Functions for Lessons ---
const fetchLessonsApi = async () => {
    const res = await fetch(LESSON_API_URL);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch lessons.");
    if (!Array.isArray(data)) throw new Error("Invalid data format from API");
    return data;
};

const createLessonApi = async (lessonData) => {
    const res = await fetch(LESSON_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lessonData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create lesson.");
    return data;
};

const deleteLessonApi = async (id) => {
    const res = await fetch(`${LESSON_API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete lesson.");
    return true;
};

// --- API Interaction Functions for Users ---
const fetchUsersFromDatabase = async () => {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to fetch user data from server.");
    }
    return response.json();
};

const deleteUserApi = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
    });
    if (response.status !== 204 && response.status !== 200) {
        throw new Error("Failed to delete user via API.");
    }
    return true; 
};

const updateUserRoleApi = async (userId, newRole) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRole }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to update user role via API.");
    }
    return true; 
};

// --- Utility Functions (Media) ---
const getInitialData = (key, defaultValue) => {
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        return defaultValue;
    }
};

const initialMedia = getInitialData('adminMedia', [
    { id: uuidv4(), type: "image", url: "https://placehold.co/150x100/0000FF/808080?text=FeatureBanner", title: "Feature Banner", sprintId: '' },
    { id: uuidv4(), type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0", title: "Intro Video", sprintId: '' },
]);

// -------------------------------------------------------------
// --- 1. Enhanced Sprint Management Component ---
// -------------------------------------------------------------

const SprintManagement = ({ sprints, setSprints, setIsLoading, setError }) => {
    const [newSprint, setNewSprint] = useState({ 
        title: '', 
        description: '', 
        videoUrl: '', 
        maxDurationMinutes: 60,
        thumbnailUrl: '', 
    });
    const [selectedFile, setSelectedFile] = useState(null);

    const handleAddSprint = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (!newSprint.title || !newSprint.description || !newSprint.videoUrl || !newSprint.maxDurationMinutes) {
            setError("Title, Description, Video URL/Path, and Max Duration are required.");
            return;
        }
        
        const dataToSend = newSprint; 

        try {
            setIsLoading(true);
            const response = await createSprintApi(dataToSend);
            setIsLoading(false);
            
            const newSprintObject = {
                id: response.id,
                title: response.title,
                description: response.description,
                videoUrl: response.video_url, 
                maxDurationSeconds: response.max_duration_seconds, 
                is_active: response.is_active, 
                thumbnailUrl: response.thumbnail_url, 
            };

            setSprints(prevSprints => [newSprintObject, ...prevSprints]); 
            setNewSprint({ title: '', description: '', videoUrl: '', maxDurationMinutes: 60, thumbnailUrl: '' });
            setSelectedFile(null);
        } catch (err) {
            setError(`Failed to add sprint: ${err.message}`);
            setIsLoading(false);
        }
    };

    const handleDeleteSprint = async (id) => {
        setError(null);
        if (!window.confirm("Are you sure you want to delete this sprint?")) return;
        
        try {
            setIsLoading(true);
            await deleteSprintApi(id);
            setIsLoading(false);
            
            setSprints(prevSprints => prevSprints.filter(s => s.id !== id));
        } catch (e) {
            setError(`Deletion failed: ${e.message}`);
            setIsLoading(false);
        }
    };

    const toggleSprintStatus = async (id, currentStatus) => {
        setError(null);
        const shouldActivate = !currentStatus;
        
        try {
            setIsLoading(true);
            await updateSprintStatusApi(id, shouldActivate); 
            setIsLoading(false);
            
            setSprints(prevSprints => prevSprints.map(s => {
                if (s.id === id) {
                    return { ...s, is_active: shouldActivate };
                } else if (shouldActivate) {
                    return { ...s, is_active: false };
                }
                return s;
            }));

        } catch (e) {
            setError(`Status update failed: ${e.message}`);
            setIsLoading(false);
        }
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        
        if (file) {
            setNewSprint(prev => ({ ...prev, videoUrl: `/uploads/${file.name}` }));
        } else {
            setNewSprint(prev => ({ ...prev, videoUrl: '' }));
        }
    };

    const inputClasses = "w-full bg-gray-800/70 p-3 rounded-xl border border-gray-600 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200 backdrop-blur-sm";
    const buttonClasses = "py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg";

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-violet-700/30 to-purple-700/30 p-6 rounded-2xl border border-violet-500/30">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <i className="fas fa-rocket mr-3 text-yellow-400"></i>
                    Add New Video Sprint
                </h3>
                <p className="text-gray-300 text-sm">Create engaging video learning sprints for your users</p>
            </div>

            <form onSubmit={handleAddSprint} className="grid grid-cols-1 lg:grid-cols-7 gap-4 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm">
                
                <input
                    type="text"
                    value={newSprint.title}
                    onChange={(e) => setNewSprint({ ...newSprint, title: e.target.value })}
                    placeholder="🎯 Title (e.g., React Hooks Sprint)"
                    className={`${inputClasses} lg:col-span-2`}
                    required
                />
                <input
                    type="number"
                    value={newSprint.maxDurationMinutes}
                    onChange={(e) => setNewSprint({ ...newSprint, maxDurationMinutes: parseInt(e.target.value) || 0 })}
                    placeholder="⏱️ Duration (minutes)"
                    className={`${inputClasses} lg:col-span-1`}
                    min="1"
                    max="60" 
                    required
                />
                <input
                    type="text"
                    value={newSprint.description}
                    onChange={(e) => setNewSprint({ ...newSprint, description: e.target.value })}
                    placeholder="📝 Description"
                    className={`${inputClasses} lg:col-span-2`}
                    required
                />
                 <input
                    type="url"
                    value={newSprint.thumbnailUrl} 
                    onChange={(e) => setNewSprint({ ...newSprint, thumbnailUrl: e.target.value })}
                    placeholder="🖼️ Thumbnail URL (Optional)"
                    className={`${inputClasses} lg:col-span-2`}
                />
                
                <div className={`${inputClasses} lg:col-span-3 flex items-center justify-between p-0 border-0 bg-transparent`}>
                    <label className="text-sm text-gray-400 mr-2">🎥 Select Video File:</label>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="p-2 rounded-xl bg-gray-800 text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700 transition-all"
                    />
                </div>
                
                <div className="lg:col-span-1 flex items-center justify-center">
                    <span className="text-sm font-semibold text-violet-300 bg-violet-900/30 px-3 py-2 rounded-xl">
                        -- OR --
                    </span>
                </div>

                <input
                    type="text" 
                    value={newSprint.videoUrl}
                    onChange={(e) => {
                        setNewSprint({ ...newSprint, videoUrl: e.target.value });
                        setSelectedFile(null); 
                    }}
                    placeholder="🔗 Video URL (YouTube Embed) or File Path"
                    className={`${inputClasses} lg:col-span-3`}
                    required
                />
                
                <div className="lg:col-span-7 text-xs text-yellow-300 bg-yellow-900/20 p-3 rounded-lg">
                    <i className="fas fa-info-circle mr-2"></i>
                    *Note: Selecting a file automatically sets the file path. File upload requires server-side implementation.
                </div>

                <button type="submit" className={`${buttonClasses} bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white lg:col-span-7 mt-2 flex items-center justify-center`}>
                    <i className="fas fa-plus mr-2"></i>
                    Add Sprint
                </button>
            </form>

            <div className="bg-gradient-to-r from-violet-700/30 to-purple-700/30 p-6 rounded-2xl border border-violet-500/30 mt-8">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <i className="fas fa-list mr-3 text-yellow-400"></i>
                    Existing Video Sprints 
                    <span className="ml-3 bg-violet-600 text-white px-3 py-1 rounded-full text-sm">
                        {sprints.length}
                    </span>
                </h3>
            </div>

            <div className="space-y-4">
                {sprints.map((sprint) => (
                    <div key={sprint.id} className="p-5 bg-gray-800/70 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-700 hover:border-violet-500/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-violet-500/10 group">
                        
                        <div className="flex items-start space-x-4 w-full md:w-auto mb-4 md:mb-0">
                            <div className="w-20 h-16 bg-gray-700 rounded-xl overflow-hidden flex-shrink-0 border border-gray-600">
                                {sprint.thumbnailUrl ? (
                                    <img 
                                        src={sprint.thumbnailUrl} 
                                        alt="Thumbnail" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x80/000000/FFFFFF?text=No+Img"; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-600">
                                        <i className="fas fa-image"></i>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-lg text-white truncate flex items-center">
                                    {sprint.title}
                                    <span className={`ml-3 text-xs font-medium px-2 py-1 rounded-full ${sprint.is_active ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                                        {sprint.is_active ? '🟢 Active' : '🔴 Inactive'}
                                    </span>
                                </p>
                                <p className="text-gray-300 text-sm line-clamp-2">{sprint.description}</p>
                                <div className="mt-2 space-x-3 text-xs flex flex-wrap gap-2">
                                    <span className="text-violet-300 bg-violet-900/30 px-2 py-1 rounded-lg flex items-center">
                                        <i className="fas fa-clock mr-1"></i>
                                        Duration: {sprint.maxDurationSeconds / 60} min
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-2 w-full md:w-auto justify-end">
                            <button
                                onClick={() => toggleSprintStatus(sprint.id, sprint.is_active)}
                                className={`${buttonClasses} ${sprint.is_active ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'} text-white flex items-center`}
                            >
                                <i className={`fas ${sprint.is_active ? 'fa-pause' : 'fa-play'} mr-2`}></i>
                                {sprint.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                                onClick={() => handleDeleteSprint(sprint.id)}
                                className={`${buttonClasses} bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white flex items-center`}
                            >
                                <i className="fas fa-trash mr-2"></i>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// -------------------------------------------------------------
// --- 2. Enhanced Media Management Component ---
// -------------------------------------------------------------

const MediaManagement = ({ media, setMedia, sprints }) => {
    const [newMedia, setNewMedia] = useState({ title: '', type: 'image', url: '', sprintId: '' });

    useEffect(() => {
        if (sprints.length > 0 && newMedia.sprintId === '') {
            setNewMedia(prev => ({ ...prev, sprintId: sprints[0].id }));
        }
    }, [sprints, newMedia.sprintId]);

    const handleAddMedia = (e) => {
        e.preventDefault();
        const sprintId = newMedia.sprintId || sprints[0]?.id || ''; 
        if (!newMedia.title || !newMedia.url || !sprintId) return;

        const mediaToAdd = {
            id: uuidv4(),
            ...newMedia,
            sprintId, 
        };
        const updatedMedia = [...media, mediaToAdd];
        setMedia(updatedMedia);
        localStorage.setItem('adminMedia', JSON.stringify(updatedMedia));
        setNewMedia({ title: '', type: 'image', url: '', sprintId: sprintId }); 
    };

    const handleDeleteMedia = (id) => {
        const updatedMedia = media.filter(m => m.id !== id);
        setMedia(updatedMedia);
        localStorage.setItem('adminMedia', JSON.stringify(updatedMedia));
    };

    const inputClasses = "w-full bg-gray-800/70 p-3 rounded-xl border border-gray-600 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm transition-all duration-200 backdrop-blur-sm";
    const buttonClasses = "py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg";

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-violet-700/30 to-purple-700/30 p-6 rounded-2xl border border-violet-500/30">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <i className="fas fa-photo-video mr-3 text-yellow-400"></i>
                    Media Asset Management
                </h3>
                <p className="text-gray-300 text-sm">Manage images and videos for your learning sprints</p>
            </div>

            <form onSubmit={handleAddMedia} className="grid grid-cols-1 lg:grid-cols-6 gap-4 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm">
                <input
                    type="text"
                    value={newMedia.title}
                    onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                    placeholder="📝 Title"
                    className={`${inputClasses} lg:col-span-1`}
                    required
                />
                <select
                    value={newMedia.type}
                    onChange={(e) => setNewMedia({ ...newMedia, type: e.target.value })}
                    className={`${inputClasses} lg:col-span-1`}
                >
                    <option value="image">🖼️ Image</option>
                    <option value="video">🎥 Video</option>
                </select>
                <input
                    type="url"
                    value={newMedia.url}
                    onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })}
                    placeholder="🔗 URL (Image/Video Embed)"
                    className={`${inputClasses} lg:col-span-2`}
                    required
                />
                <select
                    value={newMedia.sprintId}
                    onChange={(e) => setNewMedia({ ...newMedia, sprintId: e.target.value })}
                    className={`${inputClasses} lg:col-span-1`}
                    required
                    disabled={sprints.length === 0}
                >
                    <option value="">Select Sprint</option>
                    {sprints.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                </select>
                <button type="submit" className={`${buttonClasses} bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white lg:col-span-1 flex items-center justify-center`} disabled={sprints.length === 0}>
                    <i className="fas fa-plus mr-2"></i>
                    Add Media
                </button>
            </form>

            <div className="bg-gradient-to-r from-violet-700/30 to-purple-700/30 p-6 rounded-2xl border border-violet-500/30">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <i className="fas fa-images mr-3 text-yellow-400"></i>
                    Existing Media Library
                    <span className="ml-3 bg-violet-600 text-white px-3 py-1 rounded-full text-sm">
                        {media.length}
                    </span>
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {media.map((item) => (
                    <div key={item.id} className="bg-gray-800/70 p-5 rounded-2xl shadow-lg border border-gray-700 hover:border-violet-500/50 transition-all duration-300 backdrop-blur-sm hover:shadow-xl hover:shadow-violet-500/10 group">
                        <div className="flex justify-between items-start mb-3">
                            <p className="font-bold text-lg text-white truncate group-hover:text-violet-300 transition-colors">{item.title}</p>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.type === 'image' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
                                {item.type === 'image' ? '🖼️ Image' : '🎥 Video'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3 flex items-center">
                            <i className="fas fa-rocket mr-1"></i>
                            Sprint: {sprints.find(s => s.id === item.sprintId)?.title || 'N/A'}
                        </p>
                        <div className="h-40 bg-gray-700/50 mb-4 flex items-center justify-center overflow-hidden rounded-xl border border-gray-600 group-hover:border-violet-500/30 transition-all">
                            {item.type === 'image' && <img src={item.url} alt={item.title} className="max-w-full max-h-full object-cover transition-transform group-hover:scale-105 duration-500" />}
                            {item.type === 'video' && (
                                <iframe
                                    src={item.url}
                                    title={item.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                ></iframe>
                            )}
                        </div>
                        <button
                            onClick={() => handleDeleteMedia(item.id)}
                            className={`w-full ${buttonClasses} bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white flex items-center justify-center`}
                        >
                            <i className="fas fa-trash mr-2"></i>
                            Delete Media
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// -------------------------------------------------------------
// --- 3. Enhanced Category Management Component ---
// -------------------------------------------------------------

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState("");

    const inputClasses = "p-3 rounded-xl bg-gray-800/70 border border-gray-600 w-full focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm transition-all duration-200 backdrop-blur-sm";
    const buttonClasses = "py-2 px-4 rounded-xl text-white font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg";

    const loadCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchCategoriesApi();
            setCategories(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess("");
        const name = newCategoryName.trim();
        if (!name) {
            setError("Category name cannot be empty.");
            return;
        }

        try {
            setIsLoading(true);
            const data = await createCategoryApi(name);
            setCategories((prev) => [...prev, { id: data.id, name: data.name }]);
            setNewCategoryName("");
            setSuccess(`✅ Category "${name}" added successfully!`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete the category "${name}"? This will fail if lessons still use it.`)) return;
        try {
            await deleteCategoryApi(id); 
            setCategories((prev) => prev.filter((c) => c.id !== id));
            setSuccess(`✅ Category "${name}" deleted successfully!`);
        } catch (err) {
            setError("Error deleting category: " + err.message);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-violet-700/30 to-purple-700/30 p-6 rounded-2xl border border-violet-500/30">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <i className="fas fa-tags mr-3 text-yellow-400"></i>
                    Manage Skill Categories
                </h3>
                <p className="text-gray-300 text-sm">Organize lessons by programming languages and technologies</p>
            </div>

            {error && (
                <div className="p-4 bg-red-900/50 border border-red-700 rounded-2xl text-red-300 backdrop-blur-sm flex items-center">
                    <i className="fas fa-exclamation-triangle mr-3 text-xl"></i>
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-900/50 border border-green-700 rounded-2xl text-green-300 backdrop-blur-sm flex items-center">
                    <i className="fas fa-check-circle mr-3 text-xl"></i>
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-4 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm">
                <input
                    type="text"
                    placeholder="🚀 New Category Name (e.g., Go, PHP, Vue.js)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={inputClasses}
                    required
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`${buttonClasses} bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 flex-shrink-0 flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Adding...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-plus mr-2"></i>
                            Add Category
                        </>
                    )}
                </button>
            </form>

            <div className="bg-gradient-to-r from-violet-700/30 to-purple-700/30 p-6 rounded-2xl border border-violet-500/30">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <i className="fas fa-layer-group mr-3 text-yellow-400"></i>
                    Existing Categories
                    <span className="ml-3 bg-violet-600 text-white px-3 py-1 rounded-full text-sm">
                        {categories.length}
                    </span>
                </h3>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <i className="fas fa-spinner fa-spin text-4xl text-violet-400 mb-4"></i>
                    <p className="text-gray-400">Loading categories...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="p-4 bg-gray-800/70 rounded-2xl border border-gray-700 shadow-lg flex justify-between items-center backdrop-blur-sm hover:border-violet-500/50 transition-all duration-300 group"
                        >
                            <span className="text-white font-medium group-hover:text-violet-300 transition-colors flex items-center">
                                <i className="fas fa-tag mr-2 text-violet-400"></i>
                                {category.name}
                            </span>
                            <button
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                                className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-xs rounded-xl transition-all duration-200 transform hover:scale-110"
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// -------------------------------------------------------------
// --- 4. Enhanced Lesson Management Component ---
// -------------------------------------------------------------

const LessonManagement = () => {
    const [lessons, setLessons] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [newLesson, setNewLesson] = useState({
        title: "",
        code_snippet: "",
        description: "",
        challenge: "",
        reflection: "",
        skill_category_id: "",
        level: "beginner",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState("");

    const inputClasses = "p-3 rounded-xl bg-gray-800/70 border border-gray-600 w-full focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm transition-all duration-200 backdrop-blur-sm";
    const buttonClasses = "py-2 px-4 rounded-xl text-white font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg";
    
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const categoriesData = await fetchCategoriesApi();
                setCategories(categoriesData);
                
                const lessonsData = await fetchLessonsApi();
                setLessons(lessonsData);
                
                if (categoriesData.length > 0) {
                    setNewLesson(prev => ({ ...prev, skill_category_id: categoriesData[0].id }));
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const handleAddLesson = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess("");
        
        if (!newLesson.title || !newLesson.description) {
            setError("Title and Description are required.");
            return;
        }
        if (categories.length > 0 && !newLesson.skill_category_id) {
            setError("A skill category must be selected.");
            return;
        }

        try {
            setIsLoading(true);
            const data = await createLessonApi(newLesson);
            
            const createdLesson = {
                id: data.id,
                title: newLesson.title,
                code_snippet: newLesson.code_snippet,
                description: newLesson.description,
                challenge: newLesson.challenge,
                reflection: newLesson.reflection,
                skill_category: categories.find(c => c.id === parseInt(newLesson.skill_category_id))?.name || 'N/A',
                level: newLesson.level,
                created_at: new Date().toISOString()
            };

            setLessons((prev) => [createdLesson, ...prev]);
            setNewLesson({
                title: "",
                code_snippet: "",
                description: "",
                challenge: "",
                reflection: "",
                skill_category_id: categories[0]?.id || "",
                level: "beginner",
            });
            setSuccess("✅ Lesson added successfully!");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteLesson = async (id) => {
        if (!window.confirm("Are you sure you want to delete this lesson?")) return;
        try {
            await deleteLessonApi(id); 
            setLessons((prev) => prev.filter((l) => l.id !== id));
            setSuccess("✅ Lesson deleted successfully!");
        } catch (err) {
            setError("Error deleting lesson: " + err.message);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-violet-700/30 to-purple-700/30 p-6 rounded-2xl border border-violet-500/30">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <i className="fas fa-book-open mr-3 text-yellow-400"></i>
                    Text Lesson Management
                </h3>
                <p className="text-gray-300 text-sm">Create and manage text-based coding lessons</p>
            </div>

            {error && (
                <div className="p-4 bg-red-900/50 border border-red-700 rounded-2xl text-red-300 backdrop-blur-sm flex items-center">
                    <i className="fas fa-exclamation-triangle mr-3 text-xl"></i>
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-900/50 border border-green-700 rounded-2xl text-green-300 backdrop-blur-sm flex items-center">
                    <i className="fas fa-check-circle mr-3 text-xl"></i>
                    <span>{success}</span>
                </div>
            )}

            <form
                onSubmit={handleAddLesson}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm"
            >
                <input
                    type="text"
                    placeholder="📚 Lesson Title"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    className={inputClasses}
                    required
                />
                
                <div className="lg:col-span-1">
                    <label className="block text-sm text-gray-300 mb-1 flex items-center">
                        <i className="fas fa-tag mr-2"></i>
                        Skill Category
                    </label>
                    <select
                        value={newLesson.skill_category_id}
                        onChange={(e) => setNewLesson({ ...newLesson, skill_category_id: e.target.value })}
                        className={`${inputClasses} text-gray-200`}
                        required
                    >
                        {categories.length === 0 ? (
                            <option value="">No categories available - Add one in the Categories tab</option>
                        ) : (
                            categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))
                        )}
                    </select>
                </div>

                <div className="lg:col-span-1">
                    <label className="block text-sm text-gray-300 mb-1 flex items-center">
                        <i className="fas fa-chart-line mr-2"></i>
                        Lesson Level
                    </label>
                    <select
                        value={newLesson.level}
                        onChange={(e) => setNewLesson({ ...newLesson, level: e.target.value })}
                        className={`${inputClasses} text-gray-200`}
                    >
                        <option value="beginner">🟢 Beginner</option>
                        <option value="intermediate">🟡 Intermediate</option>
                        <option value="advanced">🔴 Advanced</option>
                    </select>
                </div>

                <div className="lg:col-span-2">
                    <label className="block text-sm text-gray-300 mb-1 flex items-center">
                        <i className="fas fa-code mr-2"></i>
                        Code Snippet
                    </label>
                    <textarea
                        placeholder="💻 Enter your code example here..."
                        value={newLesson.code_snippet}
                        onChange={(e) => setNewLesson({ ...newLesson, code_snippet: e.target.value })}
                        className={`${inputClasses} h-32 font-mono text-sm`}
                    ></textarea>
                </div>

                <div className="lg:col-span-2">
                    <label className="block text-sm text-gray-300 mb-1 flex items-center">
                        <i className="fas fa-align-left mr-2"></i>
                        Description
                    </label>
                    <textarea
                        placeholder="📝 Lesson description and learning objectives..."
                        value={newLesson.description}
                        onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                        className={`${inputClasses} h-24`}
                        required
                    ></textarea>
                </div>

                <input
                    type="text"
                    placeholder="🎯 Challenge Task"
                    value={newLesson.challenge}
                    onChange={(e) => setNewLesson({ ...newLesson, challenge: e.target.value })}
                    className={`${inputClasses} lg:col-span-2`}
                />
                <input
                    type="text"
                    placeholder="🤔 Reflection Question"
                    value={newLesson.reflection}
                    onChange={(e) => setNewLesson({ ...newLesson, reflection: e.target.value })}
                    className={`${inputClasses} lg:col-span-2`}
                />
                <button
                    type="submit"
                    disabled={isLoading || categories.length === 0}
                    className={`${buttonClasses} lg:col-span-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 flex items-center justify-center ${(isLoading || categories.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Adding Lesson...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-plus mr-2"></i>
                            Add Lesson
                        </>
                    )}
                </button>
            </form>

            <div className="bg-gradient-to-r from-violet-700/30 to-purple-700/30 p-6 rounded-2xl border border-violet-500/30">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <i className="fas fa-book mr-3 text-yellow-400"></i>
                    Existing Lessons
                    <span className="ml-3 bg-violet-600 text-white px-3 py-1 rounded-full text-sm">
                        {lessons.length}
                    </span>
                </h3>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <i className="fas fa-spinner fa-spin text-4xl text-violet-400 mb-4"></i>
                    <p className="text-gray-400">Loading lessons...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Array.isArray(lessons) && lessons.length > 0 ? (
                        lessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                className="p-5 bg-gray-800/70 rounded-2xl border border-gray-700 shadow-lg flex flex-col lg:flex-row justify-between items-start backdrop-blur-sm hover:border-violet-500/50 transition-all duration-300 group"
                            >
                                <div className="flex-1">
                                    <h3 className="text-white text-lg font-bold mb-2 group-hover:text-violet-300 transition-colors flex items-center">
                                        {lesson.title}
                                        <span className={`ml-3 text-xs font-semibold px-2 py-1 rounded-full ${
                                            lesson.level === "beginner" ? "bg-green-500/20 text-green-300 border border-green-500/30" :
                                            lesson.level === "intermediate" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : 
                                            "bg-red-500/20 text-red-300 border border-red-500/30"
                                        }`}>
                                            {lesson.level}
                                        </span>
                                    </h3>
                                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                                        {lesson.description?.length > 100 
                                            ? `${lesson.description.substring(0, 100)}...` 
                                            : lesson.description
                                        }
                                    </p>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="text-violet-300 bg-violet-900/30 px-2 py-1 rounded-lg flex items-center">
                                            <i className="fas fa-tag mr-1"></i>
                                            {lesson.skill_category || "N/A"}
                                        </span>
                                        <span className="text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg flex items-center">
                                            <i className="fas fa-calendar mr-1"></i>
                                            {new Date(lesson.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                    className="mt-4 lg:mt-0 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center"
                                >
                                    <i className="fas fa-trash mr-2"></i>
                                    Delete
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-gray-800/50 rounded-2xl border border-gray-700 backdrop-blur-sm">
                            <i className="fas fa-book-open text-5xl text-gray-500 mb-4"></i>
                            <p className="text-gray-400 text-lg">No lessons found</p>
                            <p className="text-gray-500 text-sm mt-2">Create your first lesson above to get started!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// -------------------------------------------------------------
// --- 5. Enhanced User Management Component ---
// -------------------------------------------------------------

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const buttonClasses = "py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg";

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const data = await fetchUsersFromDatabase();
                setUsers(data);
            } catch (err) {
                setError(`Error: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        loadUsers();
    }, []);

    const handleDeleteUser = useCallback(async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        
        try {
            await deleteUserApi(id); 
            const updatedUsers = users.filter(u => u.id !== id);
            setUsers(updatedUsers);
        } catch (e) {
            setError(`Deletion failed: ${e.message}`);
        }
    }, [users]); 

    const toggleUserRole = useCallback(async (id) => {
        const userToUpdate = users.find(u => u.id === id);
        if (!userToUpdate) return;
        
        const newRole = userToUpdate.role === 'user' ? 'admin' : 'user';

        try {
            await updateUserRoleApi(id, newRole);

            const updatedUsers = users.map(u => u.id === id ? { ...u, role: newRole } : u);
            setUsers(updatedUsers);
        } catch (e) {
            setError(`Role update failed: ${e.message}`);
        }
    }, [users]);
    
    if (isLoading) return (
        <div className="text-center p-12">
            <i className="fas fa-spinner fa-spin text-4xl text-violet-400 mb-4"></i>
            <p className="text-violet-400 text-lg">Loading users...</p>
        </div>
    );
    
    if (error) return (
        <div className="p-6 bg-red-900/50 border border-red-700 rounded-2xl text-red-300 backdrop-blur-sm flex items-center">
            <i className="fas fa-exclamation-triangle mr-3 text-xl"></i>
            <span>{error}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-violet-700/30 to-purple-700/30 p-6 rounded-2xl border border-violet-500/30">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <i className="fas fa-users-cog mr-3 text-yellow-400"></i>
                    User Management
                    <span className="ml-3 bg-violet-600 text-white px-3 py-1 rounded-full text-sm">
                        {users.length}
                    </span>
                </h3>
                <p className="text-gray-300 text-sm">Manage user accounts, roles, and permissions</p>
            </div>

            <div className="bg-gray-800/50 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/70">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Streak</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-white">{user.name}</div>
                                                <div className="text-xs text-gray-400">ID: {user.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            user.role === 'admin' 
                                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        }`}>
                                            <i className={`fas ${user.role === 'admin' ? 'fa-crown' : 'fa-user'} mr-1`}></i>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-sm font-bold text-white mr-2">{user.streak_days || 0}</span>
                                            <span className="text-xs text-gray-400">days</span>
                                            {user.streak_days > 0 && (
                                                <i className="fas fa-fire ml-2 text-orange-500"></i>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => toggleUserRole(user.id)}
                                            className={`${buttonClasses} ${
                                                user.role === 'user' 
                                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' 
                                                    : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600'
                                            } text-white flex items-center`}
                                        >
                                            <i className={`fas ${user.role === 'user' ? 'fa-arrow-up' : 'fa-arrow-down'} mr-2`}></i>
                                            {user.role === 'user' ? 'Promote' : 'Demote'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className={`${buttonClasses} bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white flex items-center`}
                                        >
                                            <i className="fas fa-trash mr-2"></i>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// -------------------------------------------------------------
// --- Enhanced Main Admin Dashboard Component ---
// -------------------------------------------------------------

const AdminDashboard = () => {
    const navigate = useMemo(() => (path, options) => {
        console.log(`Navigating to: ${path}`);
        // In a real React app with React Router, you would use:
        // navigate(path, options);
    }, []); 
    
    const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('isAdminAuthenticated') === 'true');
    const [activeTab, setActiveTab] = useState('sprints'); 
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // State for Sprints
    const [sprints, setSprints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for Media (Local Storage management)
    const [media, setMedia] = useState(initialMedia);
    
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/admin_login', { replace: true }); 
            return;
        }

        const loadSprints = async () => {
            setError(null);
            setIsLoading(true);
            try {
                const data = await fetchSprintsApi();
                const formattedSprints = data.map(s => ({
                    id: s.id,
                    title: s.title,
                    description: s.description,
                    videoUrl: s.video_url, 
                    maxDurationSeconds: s.max_duration_seconds, 
                    is_active: s.is_active,
                    thumbnailUrl: s.thumbnail_url, 
                }));
                setSprints(formattedSprints);
            } catch (err) {
                setError(`Failed to load sprints: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        loadSprints();
    }, [isAuthenticated, navigate]); 

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        sessionStorage.removeItem('isAdminAuthenticated');
        setIsAuthenticated(false);
        setShowLogoutConfirm(false);
        
        setTimeout(() => {
            navigate('/admin_login');
        }, 100);
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };
    
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                <div className="text-white text-center p-10 bg-gray-800/50 rounded-2xl border border-gray-700 backdrop-blur-sm">
                    <i className="fas fa-spinner fa-spin text-4xl text-violet-400 mb-4"></i>
                    <p className="text-xl">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    const tabClasses = "py-3 px-6 font-semibold text-lg border-b-2 transition-all duration-300 rounded-t-xl flex items-center";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl border border-violet-500/30 p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center mb-4">
                            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-xl mr-4">
                                <i className="fas fa-sign-out-alt text-white text-xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white">Confirm Logout</h3>
                        </div>
                        
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to logout from the Admin Dashboard? You'll need to login again to access the control panel.
                        </p>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={cancelLogout}
                                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-all duration-200 text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-xl font-semibold transition-all duration-200 text-white"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex flex-col lg:flex-row justify-between items-center pb-8 border-b border-violet-800/50 mb-8 bg-gray-800/30 p-6 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center mb-4 lg:mb-0">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-3 rounded-xl mr-4">
                        <i className="fas fa-tools text-2xl text-white"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-white">Admin Control Panel</h1>
                        <p className="text-gray-400 text-sm mt-1">Manage your learning platform with ease</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="py-3 px-6 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center"
                >
                    <i className="fas fa-sign-out-alt mr-2"></i> Logout
                </button>
            </header>

            {/* Enhanced Tab Navigation */}
            <div className="flex overflow-x-auto mb-8 space-x-2 pb-2 scrollbar-hide">
                {[
                    { id: 'sprints', icon: 'fa-rocket', label: 'Video Sprints' },
                    { id: 'categories', icon: 'fa-tags', label: 'Categories' },
                    { id: 'lessons', icon: 'fa-book-open', label: 'Text Lessons' },
                    { id: 'media', icon: 'fa-photo-video', label: 'Media & Assets' },
                    { id: 'users', icon: 'fa-users-cog', label: 'User Management' },
                    { id: 'reflections', icon: 'fa-check-circle', label: 'Mark Reflections' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${tabClasses} whitespace-nowrap ${
                            activeTab === tab.id 
                                ? 'border-violet-500 text-white bg-violet-600/20 backdrop-blur-sm' 
                                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-700/50'
                        }`}
                    >
                        <i className={`fas ${tab.icon} mr-2 ${activeTab === tab.id ? 'text-yellow-400' : ''}`}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-gray-800/30 p-6 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm min-h-[500px]">
                
                {(isLoading && activeTab === 'sprints') && (
                    <div className="text-center p-12">
                        <i className="fas fa-spinner fa-spin text-4xl text-violet-400 mb-4"></i>
                        <p className="text-violet-400 text-lg">Loading data...</p>
                    </div>
                )}
                
                {error && activeTab === 'sprints' && (
                    <div className="p-4 bg-red-900/50 border border-red-700 rounded-2xl text-red-300 mb-4 backdrop-blur-sm flex items-center">
                        <i className="fas fa-exclamation-triangle mr-3 text-xl"></i>
                        <span>{error}</span>
                    </div>
                )}
                
                {activeTab === 'sprints' && (
                    <SprintManagement 
                        sprints={sprints} 
                        setSprints={setSprints} 
                        setIsLoading={setIsLoading} 
                        setError={setError}
                    />
                )}
                {activeTab === 'categories' && <CategoryManagement />}
                {activeTab === 'lessons' && <LessonManagement />}
                {activeTab === 'media' && <MediaManagement media={media} setMedia={setMedia} sprints={sprints} />}
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'reflections' && <ReflectionManagement />}
            </div>

            {/* Footer */}
            <footer className="mt-8 text-center text-gray-500 text-sm">
                <p>Admin Dashboard v2.0 • Built with React & Tailwind CSS</p>
            </footer>
        </div>
    );
};

export default AdminDashboard;
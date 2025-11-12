// ==================================================================
// Sprints.jsx - Redesigned with Dashboard Theme & Black Borders
// ==================================================================

import React, { useState, useEffect, useCallback, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom"; 

// --- Configuration ---
const API_BASE_URL = 'http://localhost:5050/api'; 
const SERVER_ROOT = 'http://localhost:5050'; 
const PROGRESS_API_URL = `${API_BASE_URL}/progress`;
const NOTES_API_URL = `${API_BASE_URL}/notes`;

// --- Authentication and Utility Functions ---
const getUserId = () => {
    const storedId = sessionStorage.getItem('userId');
    const userId = parseInt(storedId, 10);
    return (userId > 0) ? userId : 9; 
}; 
const getAuthHeaders = (contentType = 'application/json') => ({
    'Content-Type': contentType,
    'X-User-Id': getUserId(), 
});

const getAbsoluteVideoUrl = (videoUrl) => {
    if (!videoUrl || videoUrl.startsWith('http')) return videoUrl || '';
    const normalizedUrl = videoUrl.startsWith('/') ? videoUrl : `/${videoUrl}`;
    return `${SERVER_ROOT}${normalizedUrl}`;
};

// ------------------------------------------------------------------
// --- 1. State Management & API Hook ---
// ------------------------------------------------------------------

const initialState = { 
    video: null,
    progress: { progress: 0, completed: false },
    noteText: "", 
    loading: true, 
    error: null,
    modal: null, 
    saveStatus: { progress: 'idle', note: 'idle' } 
};

const dataFetchReducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_INIT':
            return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS':
            return { 
                ...state, 
                loading: false, 
                video: action.payload.video, 
                progress: action.payload.progress,
                noteText: action.payload.noteText || ""
            };
        case 'FETCH_FAILURE':
            return { ...state, loading: false, error: action.payload };
        case 'UPDATE_PROGRESS':
            return { ...state, progress: action.payload, saveStatus: { ...state.saveStatus, progress: 'success' } };
        case 'UPDATE_NOTE_TEXT':
            return { ...state, noteText: action.payload };
        case 'SET_MODAL':
            return { ...state, modal: action.payload };
        case 'SET_SAVE_STATUS':
            return { ...state, saveStatus: { ...state.saveStatus, [action.payload.key]: action.payload.status } };
        default:
            return state;
    }
};

const useProgressApi = (sprintId) => {
    const validatedSprintId = parseInt(sprintId, 10); 
    
    const [state, dispatch] = useReducer(dataFetchReducer, initialState);

    const loadSprintData = useCallback(async (id) => {
        if (!id || isNaN(id)) {
            dispatch({ type: 'FETCH_FAILURE', payload: "Invalid Sprint ID provided." });
            return;
        }
        dispatch({ type: 'FETCH_INIT' });
        try {
            const [allSprintsResponse, userProgressResponse, userNoteResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/sprints`),
                fetch(PROGRESS_API_URL, { headers: getAuthHeaders() }),
                fetch(`${NOTES_API_URL}/video_sprint/${id}`, { headers: getAuthHeaders() }).catch((e) => {
                    console.warn("Note fetch failed, providing empty noteText fallback:", e.message);
                    return { ok: true, json: () => ({ note_text: "" }) };
                })
            ]);
            
            const [allSprints, userProgressData, userNoteData] = await Promise.all([
                allSprintsResponse.json(),
                userProgressResponse.json(),
                userNoteResponse.json()
            ]);

            if (!allSprintsResponse.ok) throw new Error(allSprints.error || 'Failed to fetch sprints.');
            if (!userProgressResponse.ok) throw new Error(userProgressData.error || 'Failed to fetch user progress.');
            
            const activeSprintData = allSprints.find(s => s.id === id);
            if (!activeSprintData) throw new Error(`Sprint with ID ${id} not found.`);
            
            const progressKey = `dynamic-sprint-${id}`; 
            const currentProgress = userProgressData[progressKey] || { progress: 0, completed: false };
            
            const videoData = {
                id: activeSprintData.id,
                title: activeSprintData.title,
                description: activeSprintData.description,
                videoUrl: getAbsoluteVideoUrl(activeSprintData.video_url), 
                maxDurationSeconds: activeSprintData.max_duration_seconds, 
            };
            
            dispatch({ 
                type: 'FETCH_SUCCESS', 
                payload: { video: videoData, progress: currentProgress, noteText: userNoteData.note_text } 
            });

        } catch (err) {
            dispatch({ type: 'FETCH_FAILURE', payload: err.message || "Failed to load video sprint data." });
        }
    }, []);
    
    useEffect(() => {
        loadSprintData(validatedSprintId);
    }, [validatedSprintId, loadSprintData]);

    const saveProgress = useCallback(async (percent, showCompletionModal = false) => {
        if (!state.video) return;

        const progressPercentage = Math.min(100, Math.max(0, percent));
        const isCompleted = progressPercentage >= 100;
        
        const payload = {
            sprint_id: state.video.id,
            progress_percentage: progressPercentage,
            is_completed: isCompleted ? 1 : 0, 
        };
        
        dispatch({ type: 'SET_SAVE_STATUS', payload: { key: 'progress', status: 'saving' } });

        try {
            const response = await fetch(PROGRESS_API_URL, { 
                method: 'POST', 
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            
            const data = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                throw new Error(data.error || `Server responded with status ${response.status}`);
            }
            
            const newProgress = { progress: progressPercentage, completed: isCompleted };
            dispatch({ type: 'UPDATE_PROGRESS', payload: newProgress });
            
            if (isCompleted && showCompletionModal) {
                dispatch({ 
                    type: 'SET_MODAL', 
                    payload: { 
                        type: 'completion', 
                        title: 'Sprint Complete! 🎉', 
                        message: `Congratulations! You've successfully completed "${state.video.title}". Ready for your next challenge?` 
                    } 
                });
            }

        } catch (error) {
            console.error("Error saving progress:", error);
            dispatch({ type: 'SET_SAVE_STATUS', payload: { key: 'progress', status: 'error' } });
            dispatch({ 
                type: 'SET_MODAL', 
                payload: { 
                    type: 'alert', 
                    title: 'Error Saving Progress', 
                    message: `Failed to save progress: ${error.message}.` 
                } 
            });
        }
    }, [state.video, dispatch]); 

    const saveNote = useCallback(async (text) => {
        if (!state.video) return;
        
        dispatch({ type: 'SET_SAVE_STATUS', payload: { key: 'note', status: 'saving' } });

        try {
            const payload = { contentType: "video_sprint", contentId: state.video.id, noteText: text };

            const response = await fetch(NOTES_API_URL, {
                method: 'POST', 
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            
            const data = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                throw new Error(data.error || `Server responded with status ${response.status}`);
            }
            
            dispatch({ type: 'SET_SAVE_STATUS', payload: { key: 'note', status: 'success' } });
            dispatch({ type: 'UPDATE_NOTE_TEXT', payload: text }); 
            dispatch({ 
                type: 'SET_MODAL', 
                payload: { 
                    type: 'alert', 
                    title: 'Notes Saved! ✅', 
                    message: 'Your learning notes have been saved successfully!' 
                } 
            });

        } catch (err) { 
            console.error("Error saving note:", err); 
            dispatch({ type: 'SET_SAVE_STATUS', payload: { key: 'note', status: 'error' } });
            dispatch({ 
                type: 'SET_MODAL', 
                payload: { 
                    type: 'alert', 
                    title: 'Error Saving Notes', 
                    message: `Failed to save notes: ${err.message}` 
                } 
            });
        }
    }, [state.video, dispatch]); 
    
    return { 
        ...state, 
        saveProgress, 
        saveNote, 
        dispatch 
    };
};

// ------------------------------------------------------------------
// --- 2. Enhanced Modals with Dashboard Theme ---
// ------------------------------------------------------------------

const CompletionModal = ({ title, message, onClose, onNavigate }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white border-4 border-black rounded-3xl shadow-2xl p-8 max-w-md w-full text-center transform scale-100 transition-all duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black shadow-lg">
                <i className="fas fa-trophy text-3xl text-violet-900"></i>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{title}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button 
                    onClick={onClose} 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-xl transition duration-200 border-2 border-black shadow-lg hover:shadow-xl"
                >
                    <i className="fas fa-redo mr-2"></i>
                    Review Content
                </button>
                <button 
                    onClick={onNavigate} 
                    className="bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-xl transition duration-200 border-2 border-black shadow-lg hover:shadow-xl"
                >
                    <i className="fas fa-arrow-right mr-2"></i>
                    Next Sprint
                </button>
            </div>
        </div>
    </div>
);

const CustomAlert = ({ title, message, onClose }) => {
    const isSuccess = message && (message.includes('successfully') || message.includes('✅'));
    const iconClass = isSuccess ? 'fa-check-circle text-green-500' : 'fa-exclamation-triangle text-red-500';
    const borderClass = isSuccess ? 'border-yellow-400' : 'border-red-500';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`bg-white border-4 ${borderClass} rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center transition-all duration-300`}>
                <div className={`w-16 h-16 ${isSuccess ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black`}>
                    <i className={`fas ${iconClass} text-2xl ${isSuccess ? 'text-green-600' : 'text-red-600'}`}></i>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-600 mb-5 text-sm leading-relaxed">{message}</p>
                <button 
                    onClick={onClose} 
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-700 text-white font-bold py-3 rounded-xl transition duration-200 border-2 border-black shadow-lg hover:shadow-xl"
                >
                    Got It!
                </button>
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// --- 3. Enhanced Functional Components ---
// ------------------------------------------------------------------

const Notepad = ({ initialText, onSave, onTextChange, loadingStatus }) => {
    const isSaving = loadingStatus === 'saving';

    return (
        <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-black text-gray-800 flex flex-col h-full transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
                <h3 className="text-xl font-extrabold text-gray-900 flex items-center">
                    <i className="fas fa-sticky-note text-yellow-500 mr-3"></i>
                    Learning Notes
                </h3>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full border border-black font-semibold">
                    Auto-save
                </span>
            </div>
            <textarea
                className="flex-1 w-full bg-violet-50 p-4 rounded-xl border-2 border-black text-gray-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition duration-200 resize-none placeholder-gray-500"
                placeholder="📝 Write your key takeaways, code snippets, or questions here..."
                value={initialText}
                onChange={(e) => onTextChange(e.target.value)}
                disabled={isSaving}
            ></textarea>
            <button 
                onClick={() => onSave(initialText)} 
                className={`mt-4 py-3 px-4 rounded-xl font-bold shadow-lg transition duration-200 border-2 border-black ${
                    isSaving 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 text-white hover:shadow-xl transform hover:scale-[1.02]'
                }`}
                disabled={isSaving}
            >
                {isSaving ? (
                    <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Saving Notes...
                    </>
                ) : (
                    <>
                        <i className="fas fa-save mr-2"></i>
                        Save Notes
                    </>
                )}
            </button>
        </div>
    );
};

const VideoPlayerControls = ({ video, progress, onSaveProgress, onBack }) => {
    
    const handleVideoCompletion = () => {
        onSaveProgress(100, true); 
    };
    
    const progressText = progress.completed ? "Completed! 🎉" : `${Math.round(progress.progress || 0)}% Complete`;
    const progressColor = progress.completed ? "bg-gradient-to-r from-green-600 to-green-700" : "bg-gradient-to-r from-violet-600 to-indigo-700";
    
    return (
        <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-black text-gray-800 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b-2 border-black">
                <div className="flex-1">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
                        <i className="fas fa-bolt text-yellow-500 mr-2"></i>
                        {video.title}
                    </h3>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full border border-black font-semibold">
                            <i className="fas fa-clock mr-1"></i>
                            {Math.round(video.maxDurationSeconds / 60)} min
                        </span>
                        <span className={`text-sm text-white px-3 py-1 rounded-full border border-black font-semibold ${progressColor}`}>
                            {progressText}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-black mb-6">
                <video 
                    className="w-full h-full object-cover"
                    key={video.id} 
                    src={video.videoUrl} 
                    controls 
                    onEnded={handleVideoCompletion}
                    poster="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop"
                >
                    Your browser does not support the video tag.
                </video>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Learning Progress</span>
                    <span className="text-sm font-bold text-violet-700">{Math.round(progress.progress || 0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-black">
                    <div
                        style={{ width: `${progress.progress || 0}%` }}
                        className={`h-3 ${progressColor} rounded-full transition-all duration-1000 ease-out border border-white/20`}
                    ></div>
                </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 border-t border-gray-300 pt-4">
                <div className="text-sm text-gray-600 font-medium">
                    {progress.completed ? (
                        <span className="text-green-600 flex items-center">
                            <i className="fas fa-check-circle mr-2"></i>
                            Sprint Mastered!
                        </span>
                    ) : (
                        <span className="text-violet-600 flex items-center">
                            <i className="fas fa-running mr-2"></i>
                            Keep going! You're doing great!
                        </span>
                    )}
                </div>
                <button 
                    onClick={onBack} 
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition duration-200 border-2 border-black hover:shadow-xl flex items-center"
                >
                    <i className="fas fa-arrow-left mr-2"></i> 
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

const VideoSprintView = ({ state, saveProgress, saveNote, handleExit, dispatch }) => {
    const { video, progress, noteText, saveStatus } = state;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 h-full">
            {/* Main Video Section - 2/3 width on large screens */}
            <div className="xl:col-span-2">
                <VideoPlayerControls 
                    video={video} 
                    progress={progress} 
                    onSaveProgress={saveProgress} 
                    onBack={handleExit}
                />
            </div>
            
            {/* Sidebar Section - 1/3 width on large screens */}
            <div className="xl:col-span-1 flex flex-col space-y-6 lg:space-y-8">
                {/* Description Box */}
                <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-black text-gray-800 transition-all duration-300 hover:shadow-2xl">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
                        <h4 className="text-lg font-extrabold text-gray-900 flex items-center">
                            <i className="fas fa-info-circle text-violet-600 mr-2"></i>
                            Sprint Overview
                        </h4>
                        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full border border-black font-semibold">
                            Details
                        </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-4">{video.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-violet-50 p-3 rounded-xl border-2 border-black">
                            <div className="text-sm text-violet-700 font-semibold">Duration</div>
                            <div className="text-lg font-bold text-gray-900">{Math.round(video.maxDurationSeconds / 60)} min</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-xl border-2 border-black">
                            <div className="text-sm text-yellow-700 font-semibold">Status</div>
                            <div className="text-lg font-bold text-gray-900">
                                {progress.completed ? 'Complete' : 'In Progress'}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Notepad */}
                <Notepad 
                    initialText={noteText}
                    onTextChange={(text) => dispatch({ type: 'UPDATE_NOTE_TEXT', payload: text })}
                    onSave={saveNote}
                    loadingStatus={saveStatus.note}
                /> 
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// --- 4. Main Sprints Page Component ---
// ------------------------------------------------------------------

const SprintsPage = () => {
    const navigate = useNavigate();
    const { sprintId: paramId } = useParams();
    const videoId = paramId ? parseInt(paramId, 10) : null; 

    const { 
        loading, 
        error, 
        modal, 
        dispatch, 
        saveProgress,
        saveNote,
        ...state 
    } = useProgressApi(videoId);
    
    const handleExit = useCallback(() => {
        navigate('/dashboard'); 
    }, [navigate]);
    
    const closeModal = useCallback(() => {
        dispatch({ type: 'SET_MODAL', payload: null });
        dispatch({ type: 'SET_SAVE_STATUS', payload: { key: 'progress', status: 'idle' } });
        dispatch({ type: 'SET_SAVE_STATUS', payload: { key: 'note', status: 'idle' } });
    }, [dispatch]);

    if (!videoId || isNaN(videoId)) {
         return (
             <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 px-4 font-['Poppins']">
                 <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-black text-center max-w-md w-full">
                     <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
                     <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Invalid Sprint</h2>
                     <p className="text-gray-600 mb-6">The sprint ID in the URL is invalid. Please navigate from the dashboard.</p>
                     <button 
                         onClick={handleExit}
                         className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white font-bold py-3 px-6 rounded-xl border-2 border-black shadow-lg hover:shadow-xl transition duration-200"
                     >
                         <i className="fas fa-home mr-2"></i>
                         Return to Dashboard
                     </button>
                 </div>
             </div>
         );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 px-4 font-['Poppins']">
                <div className="text-center bg-white p-8 rounded-3xl shadow-2xl border-2 border-black">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-lg">
                        <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Loading Your Sprint</h3>
                    <p className="text-gray-600">Preparing your learning experience...</p>
                    <div className="mt-4 text-sm text-violet-600 font-semibold">
                        Sprint ID: {videoId}
                    </div>
                </div>
            </div>
        );
    }
    
    if (error || !state.video || !state.video.id) { 
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 px-4 font-['Poppins'] text-center">
                <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-black max-w-md w-full">
                    <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Error Loading Sprint</h2>
                    <p className="text-gray-600 mb-2 font-semibold">We encountered an issue:</p>
                    <p className="text-red-500 mb-6 bg-red-50 p-3 rounded-xl border border-red-200">
                        {error || `Sprint ${videoId} data could not be loaded.`}
                    </p>
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl border-2 border-black transition duration-200 flex-1"
                        >
                            <i className="fas fa-redo mr-2"></i>
                            Retry
                        </button>
                        <button 
                            onClick={handleExit}
                            className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white font-bold py-3 px-4 rounded-xl border-2 border-black shadow-lg hover:shadow-xl transition duration-200 flex-1"
                        >
                            <i className="fas fa-home mr-2"></i>
                            Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* External resources for styling and icons */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
            
<div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center font-['Poppins'] p-4 sm:p-6 lg:p-12 relative overflow-hidden">

  {/* Centered Dashboard Wrapper */}
  <div className="relative w-full max-w-9xl bg-white/90 rounded-3xl shadow-2xl border border-black p-6 sm:p-8 lg:p-12 backdrop-blur-md">

    {/* Geometric Background Pattern */}
    <div className="absolute inset-0 opacity-5 pointer-events-none rounded-3xl overflow-hidden">
      <svg className="w-full h-full" fill="none">
        <defs>
          <pattern id="pattern-hex" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" className="text-violet-500 fill-current" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pattern-hex)" />
      </svg>
    </div>

    {/* HEADER */}
    <header className="mb-6 lg:mb-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <div 
            className="flex items-center cursor-pointer"
            onClick={handleExit}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-xl flex items-center justify-center mr-3 border-2 border-white shadow-lg">
              <i className="fas fa-bolt text-white text-lg"></i>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-violet-700 tracking-tight">
              Skill<span className="text-indigo-900">Sprint</span>
            </span>
          </div>
          <div className="ml-4 sm:ml-6 pl-4 sm:pl-6 border-l-2 border-gray-300">
            <h1 className="text-lg sm:text-xl font-bold text-gray-700">Learning Sprint</h1>
            <p className="text-sm text-gray-500">Deep dive in progress</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExit}
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-xl border-2 border-black shadow-lg hover:shadow-xl transition duration-200 flex items-center"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Dashboard
          </button>
          <div className="bg-white p-2 rounded-xl border-2 border-black shadow-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-full flex items-center justify-center text-white font-bold text-sm border border-white">
              {sessionStorage.getItem('userName')?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* MAIN CONTENT */}
    <main className="flex-1 relative z-10">
      <VideoSprintView 
        state={state}
        saveProgress={saveProgress} 
        saveNote={saveNote}
        handleExit={handleExit} 
        dispatch={dispatch}
      />
    </main>

    {/* FOOTER */}
    <footer className="mt-8 lg:mt-12 pt-6 border-t-2 border-gray-300 relative z-10">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="text-sm text-gray-600 mb-4 sm:mb-0">
          © {new Date().getFullYear()} SkillSprint • Master skills in 60-minute sprints
        </div>
        <div className="flex space-x-4">
          <button className="text-gray-500 hover:text-violet-600 transition-colors">
            <i className="fas fa-question-circle text-lg"></i>
          </button>
          <button className="text-gray-500 hover:text-violet-600 transition-colors">
            <i className="fas fa-cog text-lg"></i>
          </button>
        </div>
      </div>
    </footer>

  </div>
</div>


            {/* Modal Rendering Logic */}
            {modal && modal.type === 'completion' && (
                <CompletionModal 
                    title={modal.title}
                    message={modal.message}
                    onClose={closeModal}
                    onNavigate={handleExit}
                />
            )}

            {modal && modal.type === 'alert' && (
                <CustomAlert
                    title={modal.title}
                    message={modal.message}
                    onClose={closeModal}
                />
            )}
        </>
    );
};

export default SprintsPage;
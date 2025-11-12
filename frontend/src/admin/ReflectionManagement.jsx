// src/admin/ReflectionManagement.jsx
import React, { useState, useEffect, useCallback } from "react";

const API_BASE_URL = "http://localhost:5050/api";

const ReflectionManagement = () => {
  const [submittedReflections, setSubmittedReflections] = useState([]);
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [markingData, setMarkingData] = useState({
    score: 8,
    admin_feedback: "",
    status: "marked",
  });

  const adminId = sessionStorage.getItem("userId") || "1";

  // FETCH SUBMITTED REFLECTIONS
  const fetchSubmittedReflections = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/reflections/submitted`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": adminId,
        },
      });

      const data = await res.json();

      if (res.status === 403) throw new Error("Admin privileges required.");
      if (res.status === 401) throw new Error("Unauthorized. Please log in again.");
      if (!res.ok) throw new Error(data.error || "Failed to fetch reflections.");

      setSubmittedReflections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchSubmittedReflections();
  }, [fetchSubmittedReflections]);

  // MARK REFLECTION
  const handleMarkReflection = async (reflectionId) => {
    if (!markingData.admin_feedback.trim()) {
      setError("Please provide feedback before marking.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/reflections/mark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": adminId,
        },
        body: JSON.stringify({
          reflection_id: reflectionId,
          score: markingData.score,
          admin_feedback: markingData.admin_feedback,
          status: markingData.status,
        }),
      });

      const data = await res.json();

      if (res.status === 403) throw new Error("Not authorized to mark reflections.");
      if (!res.ok) throw new Error(data.error || "Failed to mark reflection.");

      setSuccess("✅ Reflection marked successfully!");
      setSelectedReflection(null);
      setMarkingData({ score: 8, admin_feedback: "", status: "marked" });
      await fetchSubmittedReflections();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // UI
  const inputClasses =
    "w-full bg-gray-700 p-3 rounded border border-gray-600 focus:ring-violet-500 focus:border-violet-500 text-white";
  const buttonClasses = "py-2 px-4 rounded font-semibold transition";

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-white rounded-lg border border-gray-700 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-yellow-400 flex items-center">
          <i className="fas fa-pen-alt mr-2"></i> Reflection Management
        </h2>
        <button
          onClick={fetchSubmittedReflections}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded text-white font-semibold flex items-center"
        >
          <i className="fas fa-sync-alt mr-2"></i> Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-800/60 text-red-300 rounded mb-4">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-800/60 text-green-300 rounded mb-4">
          <i className="fas fa-check-circle mr-2"></i>
          {success}
        </div>
      )}

      {/* List */}
      {isLoading && !selectedReflection ? (
        <div className="text-center p-8 text-violet-400">
          <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
          <p>Loading reflections...</p>
        </div>
      ) : selectedReflection ? (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          {/* Selected Reflection */}
          <h4 className="text-lg font-bold text-yellow-400 mb-3">
            Marking: {selectedReflection.lesson_title}
          </h4>
          <textarea
            className={`${inputClasses} h-32`}
            placeholder="Provide feedback..."
            value={markingData.admin_feedback}
            onChange={(e) =>
              setMarkingData((prev) => ({
                ...prev,
                admin_feedback: e.target.value,
              }))
            }
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleMarkReflection(selectedReflection.id)}
              disabled={isLoading}
              className={`${buttonClasses} bg-green-600 hover:bg-green-700 text-white`}
            >
              Submit
            </button>
            <button
              onClick={() => setSelectedReflection(null)}
              className={`${buttonClasses} bg-gray-600 hover:bg-gray-700 text-white`}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {submittedReflections.length > 0 ? (
            submittedReflections.map((reflection) => (
              <div
                key={reflection.id}
                onClick={() => setSelectedReflection(reflection)}
                className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-violet-500 transition cursor-pointer"
              >
                <h4 className="text-yellow-400 font-semibold text-lg mb-1">
                  {reflection.lesson_title}
                </h4>
                <p className="text-gray-300 text-sm mb-2">
                  {reflection.user_name} — {reflection.user_email}
                </p>
                <p className="text-gray-400 text-xs mb-2">
                  {reflection.reflection_text.slice(0, 120)}...
                </p>
              </div>
            ))
          ) : (
            <div className="text-center p-8 text-gray-400">
              <i className="fas fa-inbox text-4xl mb-4"></i>
              <p>No reflections waiting for marking.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReflectionManagement;

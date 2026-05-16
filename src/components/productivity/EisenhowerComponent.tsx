"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, CheckCircle2, Circle, MoreVertical, Trash2, ArrowRight } from "lucide-react";

interface EisenhowerTask {
  _id: string;
  title: string;
  quadrant: "q1" | "q2" | "q3" | "q4";
  isCompleted: boolean;
}

interface EisenhowerComponentProps {
  userId: string;
}

export default function EisenhowerComponent({ userId }: EisenhowerComponentProps) {
  const [tasks, setTasks] = useState<EisenhowerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeQuadrantForNew, setActiveQuadrantForNew] = useState<string | null>(null);
  
  // State for popover menu
  const [activeMenuTask, setActiveMenuTask] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/eisenhower?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (quadrant: "q1" | "q2" | "q3" | "q4") => {
    if (!newTaskTitle.trim()) {
      setActiveQuadrantForNew(null);
      return;
    }

    try {
      const res = await fetch("/api/eisenhower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: newTaskTitle, quadrant }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks([data.task, ...tasks]);
        setNewTaskTitle("");
        setActiveQuadrantForNew(null);
      }
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<EisenhowerTask>) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updates } : t));
    setActiveMenuTask(null);

    try {
      await fetch("/api/eisenhower", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, ...updates }),
      });
    } catch (err) {
      console.error("Error updating task:", err);
      fetchTasks(); // Revert on error
    }
  };

  const deleteTask = async (taskId: string) => {
    // Optimistic UI update
    setTasks(prev => prev.filter(t => t._id !== taskId));
    setActiveMenuTask(null);

    try {
      await fetch(`/api/eisenhower?taskId=${taskId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting task:", err);
      fetchTasks(); // Revert on error
    }
  };

  const quadrants = [
    { id: "q1", title: "Do First", desc: "Urgent & Important", bg: "bg-red-50 dark:bg-red-900/10", border: "border-red-200 dark:border-red-900/30", header: "bg-red-500", text: "text-red-700 dark:text-red-300" },
    { id: "q2", title: "Schedule", desc: "Important, Not Urgent", bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200 dark:border-blue-900/30", header: "bg-blue-500", text: "text-blue-700 dark:text-blue-300" },
    { id: "q3", title: "Delegate", desc: "Urgent, Not Important", bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-900/30", header: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
    { id: "q4", title: "Eliminate", desc: "Not Urgent, Not Important", bg: "bg-gray-50 dark:bg-gray-800/50", border: "border-gray-200 dark:border-gray-700", header: "bg-gray-500", text: "text-gray-700 dark:text-gray-300" },
  ];

  if (isLoading) {
    return <div className="w-full py-12 flex justify-center text-gray-500">Loading your matrix...</div>;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((q) => {
          const qTasks = tasks.filter(t => t.quadrant === q.id);
          return (
            <div key={q.id} className={`flex flex-col rounded-2xl border ${q.border} ${q.bg}`}>
              {/* Header */}
              <div className={`${q.header} text-white p-3 flex justify-between items-center rounded-t-2xl`}>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{q.title}</h3>
                  <p className="text-xs opacity-90">{q.desc}</p>
                </div>
                <button 
                  onClick={() => setActiveQuadrantForNew(q.id)}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Task List */}
              <div className="p-3 flex-1 flex flex-col gap-2 min-h-[200px]">
                {activeQuadrantForNew === q.id && (
                  <div className="flex bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="New task..."
                      className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-gray-800 dark:text-gray-200"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addTask(q.id as any);
                        if (e.key === 'Escape') setActiveQuadrantForNew(null);
                      }}
                      onBlur={() => {
                        if (!newTaskTitle) setActiveQuadrantForNew(null);
                      }}
                    />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => addTask(q.id as any)}>
                      <CheckCircle2 className={`w-4 h-4 ${q.text}`} />
                    </Button>
                  </div>
                )}

                {qTasks.map(task => (
                  <div key={task._id} className={`relative group flex items-start gap-2 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all ${activeMenuTask === task._id ? 'z-50' : 'z-10'}`}>
                    <button 
                      onClick={() => updateTask(task._id, { isCompleted: !task.isCompleted })}
                      className="mt-0.5 shrink-0 text-gray-400 hover:text-green-500 transition-colors"
                    >
                      {task.isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                    </button>
                    
                    <span className={`flex-1 text-sm ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      {task.title}
                    </span>

                    <button 
                      onClick={() => setActiveMenuTask(activeMenuTask === task._id ? null : task._id)}
                      className="shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Action Menu Popover */}
                    {activeMenuTask === task._id && (
                      <div className="absolute top-10 right-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                        <div className="text-xs font-semibold text-gray-500 px-3 py-2 bg-gray-50 dark:bg-gray-900">Move to...</div>
                        {quadrants.filter(quad => quad.id !== q.id).map(quad => (
                          <button
                            key={quad.id}
                            onClick={() => updateTask(task._id, { quadrant: quad.id as any })}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <ArrowRight className="w-3 h-3 text-gray-400" /> {quad.title}
                          </button>
                        ))}
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                        <button
                          onClick={() => deleteTask(task._id)}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Task
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                {qTasks.length === 0 && activeQuadrantForNew !== q.id && (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-40 py-6">
                    <span className="text-sm">No tasks</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Click outside overlay for popover */}
      {activeMenuTask && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setActiveMenuTask(null)} 
        />
      )}
    </div>
  );
}

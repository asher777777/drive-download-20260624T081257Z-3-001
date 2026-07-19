"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Folder, Plus, Trash2, Send, Loader2, Maximize2, Minimize2, 
  ZoomIn, ZoomOut, Check, HelpCircle, MessageSquare, AlertCircle
} from "lucide-react";
import { WbsTask, ProjectCharter, ProjectData } from "../types";
import { updateWbsWithChat, saveProject } from "../actions";

interface WbsCanvasStepProps {
  title: string;
  projectType: "new" | "recurring";
  charter: ProjectCharter;
  initialTasks: WbsTask[];
  onBack: () => void;
  onSaveComplete: (projectId: string) => void;
}

export default function WbsCanvasStep({ title, projectType, charter, initialTasks, onBack, onSaveComplete }: WbsCanvasStepProps) {
  const [tasks, setTasks] = useState<WbsTask[]>(initialTasks);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  
  // Canvas Viewport State (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 300, y: 250 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Chat bar state
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "היי! אני המחולל. אתה יכול לבקש ממני לעדכן את העץ, לקצר זמנים, להוסיף משימות או לשנות RACI בקול חופשי." }
  ]);

  // Save state (Folder styling)
  // saveStatus: "unsaved" | "saving" | "saved" | "error"
  const [saveStatus, setSaveStatus] = useState<"unsaved" | "saving" | "saved" | "error">("unsaved");

  // Inline edit state
  const [editingTask, setEditingTask] = useState<WbsTask | null>(null);

  // Dynamic counter animation values (running counter)
  const [displayBudget, setDisplayBudget] = useState(0);
  const [displayHours, setDisplayHours] = useState(0);

  // Calculate actual current WBS totals
  const wbsTotals = useMemo(() => {
    let budget = 0;
    let days = 0;
    tasks.forEach(t => {
      budget += t.cost || 0;
      days += t.durationDays || 0;
    });
    return { budget, hours: days * 8 };
  }, [tasks]);

  // Handle counter animations
  useEffect(() => {
    let budgetStart = displayBudget;
    const budgetEnd = wbsTotals.budget;
    let hoursStart = displayHours;
    const hoursEnd = wbsTotals.hours;
    
    if (budgetStart === budgetEnd && hoursStart === hoursEnd) return;

    const duration = 800; // 800ms animation
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad formula
      const easeProgress = progress * (2 - progress);

      setDisplayBudget(Math.floor(budgetStart + (budgetEnd - budgetStart) * easeProgress));
      setDisplayHours(Math.floor(hoursStart + (hoursEnd - hoursStart) * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [wbsTotals]);

  // Layout node coordinates (Tree mind-map algorithm)
  const taskCoordinates = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};
    
    // Root node
    coords["root"] = { x: 0, y: 0 };

    const categories = tasks.filter(t => t.parentId === null);
    
    categories.forEach((cat, catIdx) => {
      // Alternate left/right for balance
      const side = catIdx % 2 === 0 ? 1 : -1;
      const angleStep = 180 / (Math.ceil(categories.length / 2) + 1);
      const levelRow = Math.floor(catIdx / 2);
      
      // Calculate category coordinates
      const catX = side * 280;
      const catY = -180 + levelRow * 220;
      coords[cat.id] = { x: catX, y: catY };

      // Children tasks of this category
      const children = tasks.filter(t => t.parentId === cat.id);
      children.forEach((child, childIdx) => {
        const childX = catX + side * 220;
        const childY = catY - 80 + childIdx * 75;
        coords[child.id] = { x: childX, y: childY };

        // Subtasks of this task
        const subtasks = tasks.filter(t => t.parentId === child.id);
        subtasks.forEach((sub, subIdx) => {
          coords[sub.id] = {
            x: childX + side * 200,
            y: childY - 30 + subIdx * 65
          };
        });
      });
    });

    return coords;
  }, [tasks]);

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    // If target is inside canvas dragging area, not a node card
    if ((e.target as HTMLElement).closest(".node-card") || (e.target as HTMLElement).closest(".action-btn")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoom = (factor: number) => {
    setZoom(prev => Math.min(Math.max(0.4, prev + factor), 1.8));
  };

  // Inline Actions
  const handleDeleteTask = (id: string) => {
    setSaveStatus("unsaved");
    
    // Helper to recursively collect all descendant task IDs
    const getDescendants = (parentId: string): string[] => {
      const children = tasks.filter(t => t.parentId === parentId);
      let ids = children.map(c => c.id);
      children.forEach(c => {
        ids = [...ids, ...getDescendants(c.id)];
      });
      return ids;
    };

    const toDelete = [id, ...getDescendants(id)];
    setTasks(prev => prev.filter(t => !toDelete.includes(t.id)));
  };

  const handleAddTask = (parentId: string) => {
    setSaveStatus("unsaved");
    const newId = `t-${Date.now()}`;
    const newTask: WbsTask = {
      id: newId,
      parentId: parentId,
      title: "משימה חדשה...",
      durationDays: 2,
      cost: 500,
      dependencies: [],
      raci: {
        r: "דרוש ביצוע",
        a: "מנהל הפרויקט",
        c: "ללא",
        i: "ללא"
      }
    };
    setTasks(prev => [...prev, newTask]);
    setEditingTask(newTask); // Open editor modal immediately
  };

  const handleSaveEdit = (edited: WbsTask) => {
    setSaveStatus("unsaved");
    setTasks(prev => prev.map(t => t.id === edited.id ? edited : t));
    setEditingTask(null);
  };

  // Chat adjustment processor
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const msg = chatMessage.trim();
    setChatMessage("");
    setChatHistory(prev => [...prev, { sender: "user", text: msg }]);
    setChatLoading(true);

    try {
      const res = await updateWbsWithChat(tasks, msg, charter.lockedBudget);
      if (res.success && res.tasks) {
        setTasks(res.tasks);
        setSaveStatus("unsaved");
        setChatHistory(prev => [...prev, { sender: "ai", text: "עץ המשימות וה-RACI עודכנו בהצלחה בעקבות בקשתך!" }]);
      } else {
        setChatHistory(prev => [...prev, { sender: "ai", text: res.error || "נכשלתי בעדכון העץ. אנא נסה פקודה אחרת." }]);
      }
    } catch (err: any) {
      setChatHistory(prev => [...prev, { sender: "ai", text: "שגיאת שרת בעיבוד הבקשה." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Save to Firebase
  const handleSaveToFirestore = async () => {
    setSaveStatus("saving");
    
    const payload: ProjectData = {
      name: title,
      type: projectType,
      status: "draft",
      smartGoals: {
        s: initialTasks[0]?.raci.r || "", // Mock fallback or pass down goals properly
        m: "",
        a: "",
        r: "",
        t: ""
      }, // In full integration, we pass state down from GeneratorRoot
      charter,
      tasks,
      userId: "" // Filled on backend
    };

    try {
      const res = await saveProject(payload);
      if (res.success && res.projectId) {
        setSaveStatus("saved");
        // Trigger flash notification color transition success
        setTimeout(() => {
          onSaveComplete(res.projectId!);
        }, 1200);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      setSaveStatus("error");
    }
  };

  // Toggle Collapse
  const toggleCollapse = (id: string) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to check if task is visible (its ancestor is not collapsed)
  const isNodeVisible = (task: WbsTask): boolean => {
    let currentParentId = task.parentId;
    while (currentParentId) {
      if (collapsedNodes[currentParentId]) return false;
      const parentNode = tasks.find(t => t.id === currentParentId);
      currentParentId = parentNode ? parentNode.parentId : null;
    }
    return true;
  };

  const isBudgetExceeded = wbsTotals.budget > charter.lockedBudget;

  return (
    <div className="w-full h-[calc(100vh-140px)] relative overflow-hidden text-right select-none font-sans" dir="rtl">
      
      {/* 1. Transparent Floating Metrics Panel (Frosted Glass) */}
      <div className="absolute top-4 right-4 z-20 bg-zinc-950/80 backdrop-blur-md border border-[#f59e0b]/30 p-5 rounded-2xl shadow-xl w-72 text-right">
        <h4 className="text-gray-400 text-xs font-bold mb-3 border-b border-[#f59e0b]/15 pb-2">מדדי ברזל - תקציב ולו"ז</h4>
        
        <div className="space-y-3">
          {/* Budget Progress Comparison */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className={`font-bold ${isBudgetExceeded ? "text-red-400" : "text-[#f59e0b]"}`}>
                {displayBudget.toLocaleString()} / {charter.lockedBudget.toLocaleString()} ₪
              </span>
              <span className="text-gray-400">תקציב (עץ / אמנה)</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-300 ${isBudgetExceeded ? "bg-red-500" : "bg-[#f59e0b]"}`}
                style={{ width: `${Math.min(100, (wbsTotals.budget / charter.lockedBudget) * 100)}%` }}
              />
            </div>
            {isBudgetExceeded && (
              <span className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                חריגה מתקציב האמנה הנעול!
              </span>
            )}
          </div>

          {/* Time Estimate */}
          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-white font-bold">{displayHours.toLocaleString()} שעות</span>
            <span className="text-gray-400">שעות עבודה מוערכות</span>
          </div>

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-white font-bold">{charter.durationDays} ימים</span>
            <span className="text-gray-400">דד-ליין מאושר באמנה</span>
          </div>
        </div>
      </div>

      {/* 2. Zoom & Pan Floating Toolbar */}
      <div className="absolute bottom-4 right-4 z-20 flex gap-2">
        <button 
          onClick={() => handleZoom(0.1)} 
          className="w-10 h-10 rounded-xl bg-zinc-950/80 border border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/10 flex items-center justify-center transition-colors"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button 
          onClick={() => handleZoom(-0.1)} 
          className="w-10 h-10 rounded-xl bg-zinc-950/80 border border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/10 flex items-center justify-center transition-colors"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button 
          onClick={() => { setZoom(0.85); setPan({ x: 300, y: 250 }); }} 
          className="w-10 h-10 rounded-xl bg-zinc-950/80 border border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/10 flex items-center justify-center transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Floating Save Icon Folder Button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={handleSaveToFirestore}
          disabled={saveStatus === "saving"}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border transition-all duration-300 active:scale-90 ${
            saveStatus === "saved"
              ? "bg-green-950 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse"
              : saveStatus === "saving"
              ? "bg-zinc-950 border-[#f59e0b]/50 text-[#f59e0b]"
              : saveStatus === "error"
              ? "bg-red-950 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              : "bg-zinc-950 border-white/30 text-white hover:border-[#f59e0b] hover:text-[#f59e0b]"
          }`}
          title="שמור פרויקט לשרת"
        >
          {saveStatus === "saving" ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Folder className={`w-6 h-6 ${saveStatus === "saved" ? "text-green-400" : saveStatus === "error" ? "text-red-400" : ""}`} />
          )}
        </button>
      </div>

      {/* 4. Canvas rendering container */}
      <div 
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-full bg-black cursor-grab active:cursor-grabbing relative overflow-hidden`}
      >
        <svg className="w-full h-full absolute inset-0 pointer-events-none">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Draw Connecting Lines */}
            {tasks.map(task => {
              if (!task.parentId || !isNodeVisible(task)) return null;
              
              // Parent coordinates
              const parentCoord = taskCoordinates[task.parentId];
              const childCoord = taskCoordinates[task.id];
              
              if (!parentCoord || !childCoord) return null;

              // Cubic bezier curves
              const midX = (parentCoord.x + childCoord.x) / 2;
              const pathData = `M ${parentCoord.x} ${parentCoord.y} C ${midX} ${parentCoord.y}, ${midX} ${childCoord.y}, ${childCoord.x} ${childCoord.y}`;

              return (
                <path
                  key={`line-${task.id}`}
                  d={pathData}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeOpacity={0.3}
                />
              );
            })}

            {/* Draw lines from root to top level categories */}
            {tasks.filter(t => t.parentId === null).map(cat => {
              const childCoord = taskCoordinates[cat.id];
              if (!childCoord) return null;
              
              const pathData = `M 0 0 C 100 0, 150 ${childCoord.y}, ${childCoord.x} ${childCoord.y}`;
              return (
                <path
                  key={`line-root-${cat.id}`}
                  d={pathData}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeOpacity={0.4}
                />
              );
            })}
          </g>
        </svg>

        {/* Absolute DOM cards wrapper */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
        >
          {/* Central Root Node (Project Title) */}
          <div 
            className="absolute p-5 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-extrabold rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)] z-10 w-52 text-center pointer-events-auto border border-[#f59e0b]"
            style={{ left: -104, top: -45 }}
          >
            <h3 className="text-sm font-black truncate">{title}</h3>
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">גרעין הפרויקט</span>
          </div>

          {/* Render all WBS tasks and categories */}
          {tasks.map(task => {
            if (!isNodeVisible(task)) return null;
            const coord = taskCoordinates[task.id];
            if (!coord) return null;

            const isCategory = task.parentId === null;
            const hasChildren = tasks.some(t => t.parentId === task.id);
            const isCollapsed = collapsedNodes[task.id];

            return (
              <div
                key={task.id}
                className="absolute w-64 pointer-events-auto node-card"
                style={{ left: coord.x - 128, top: coord.y - 50 }}
              >
                <div 
                  className={`bg-zinc-950 border ${
                    isCategory ? "border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.05)]" : "border-[#f59e0b]/40"
                  } p-4 rounded-xl relative hover:border-[#f59e0b] hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all group`}
                  onDoubleClick={() => setEditingTask(task)}
                >
                  {/* Category / Node title */}
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-white text-xs font-bold truncate max-w-[170px]" title={task.title}>
                      {task.title}
                    </span>
                    
                    <span className="text-[10px] text-gray-500 font-mono shrink-0">
                      {task.cost > 0 ? `${task.cost} ₪` : ""}
                    </span>
                  </div>

                  {/* Task details: duration */}
                  <div className="flex justify-between items-center mt-2.5">
                    <span className="text-[10px] text-gray-400">{task.durationDays} ימי עבודה</span>
                    
                    {/* Collapsible toggle */}
                    {hasChildren && (
                      <button
                        onClick={() => toggleCollapse(task.id)}
                        className="text-[#f59e0b] hover:text-white text-[10px] font-bold action-btn flex items-center gap-0.5"
                      >
                        {isCollapsed ? "[+] הרחב" : "[-] כווץ"}
                      </button>
                    )}
                  </div>

                  {/* RACI matrix tags inside node */}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#f59e0b]/10 text-[9px]">
                    <div className="flex gap-1">
                      {/* R */}
                      <div className="flex items-center gap-0.5" title={`Responsible (המבצע): ${task.raci.r}`}>
                        <span className="font-bold text-amber-500">R:</span>
                        {task.raci.r.includes("דרוש") ? (
                          <span className="text-orange-400 font-bold animate-pulse">?</span>
                        ) : (
                          <span className="text-gray-300 font-semibold">{task.raci.r}</span>
                        )}
                      </div>
                      
                      {/* A */}
                      <div className="flex items-center gap-0.5" title={`Accountable (המאשר): ${task.raci.a}`}>
                        <span className="font-bold text-yellow-500">A:</span>
                        <span className="text-gray-300 font-semibold">{task.raci.a}</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Action Buttons visible on hover */}
                  <div className="absolute -top-3 -left-3 hidden group-hover:flex gap-1.5 action-btn">
                    <button 
                      onClick={() => handleAddTask(task.id)}
                      className="w-6 h-6 rounded-lg bg-zinc-900 border border-[#f59e0b]/40 text-[#f59e0b] hover:bg-[#f59e0b]/10 flex items-center justify-center shadow-md active:scale-90"
                      title="הוסף תת משימה"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="w-6 h-6 rounded-lg bg-red-950/60 border border-red-500/40 text-red-400 hover:bg-red-950 flex items-center justify-center shadow-md active:scale-90"
                      title="מחק משימה"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Floating AI Chat Sidebar */}
      <div className="absolute top-4 left-24 z-20 w-80 bg-zinc-950/90 backdrop-blur-md border border-[#f59e0b]/20 rounded-2xl flex flex-col shadow-2xl overflow-hidden h-[420px]">
        <div className="p-3 bg-zinc-900 border-b border-[#f59e0b]/15 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#f59e0b]" />
          <h4 className="text-white text-xs font-bold">שיח עם המחולל</h4>
        </div>
        
        {/* Messages list */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin text-right text-xs">
          {chatHistory.map((chat, i) => (
            <div 
              key={i} 
              className={`p-2.5 rounded-lg max-w-[85%] leading-relaxed ${
                chat.sender === "user" 
                  ? "bg-[#f59e0b]/10 text-white mr-auto" 
                  : "bg-zinc-900 text-gray-300 ml-auto border border-[#f59e0b]/10"
              }`}
            >
              {chat.text}
            </div>
          ))}
          {chatLoading && (
            <div className="flex items-center gap-1.5 text-gray-400 p-2 border border-[#f59e0b]/10 rounded-lg ml-auto bg-zinc-900">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f59e0b]" />
              <span>המחולל חושב ומחשב מחדש...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-2 border-t border-[#f59e0b]/15 flex gap-1.5 bg-zinc-900/60">
          <input
            type="text"
            value={chatMessage}
            disabled={chatLoading}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="רשום בקשה ל-AI לשינוי העץ..."
            className="flex-1 bg-black border border-[#f59e0b]/40 focus:border-[#f59e0b] rounded-lg px-2.5 py-1.5 text-white text-xs text-right focus:outline-none transition-colors"
          />
          <button 
            type="submit" 
            disabled={chatLoading || !chatMessage.trim()}
            className="p-1.5 rounded-lg bg-[#f59e0b] text-black hover:bg-[#d97706] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 6. Inline Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-[#f59e0b] p-6 rounded-2xl w-full max-w-md text-right" dir="rtl">
            <h4 className="text-white font-bold text-base mb-4 border-b border-[#f59e0b]/15 pb-2">ערוך פרטי משימה</h4>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[#f59e0b] text-xs font-semibold">שם המשימה:</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-black border border-[#f59e0b]/40 focus:border-[#f59e0b] text-white p-2 rounded-lg text-right font-sans focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#f59e0b] text-xs font-semibold">עלות מוערכת (₪):</label>
                  <input
                    type="number"
                    value={editingTask.cost}
                    onChange={(e) => setEditingTask({ ...editingTask, cost: Number(e.target.value) })}
                    className="w-full bg-black border border-[#f59e0b]/40 focus:border-[#f59e0b] text-white p-2 rounded-lg text-right font-sans focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#f59e0b] text-xs font-semibold">ימי עבודה:</label>
                  <input
                    type="number"
                    value={editingTask.durationDays}
                    onChange={(e) => setEditingTask({ ...editingTask, durationDays: Number(e.target.value) })}
                    className="w-full bg-black border border-[#f59e0b]/40 focus:border-[#f59e0b] text-white p-2 rounded-lg text-right font-sans focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* RACI parameters */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <span className="text-gray-400 text-xs font-bold block">תפקידי RACI:</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-gray-400 text-[10px]">R (Responsible - מבצע):</label>
                    <input
                      type="text"
                      value={editingTask.raci.r}
                      onChange={(e) => setEditingTask({
                        ...editingTask,
                        raci: { ...editingTask.raci, r: e.target.value }
                      })}
                      className="w-full bg-black border border-white/10 text-white p-1.5 rounded-lg text-right text-xs focus:outline-none focus:border-[#f59e0b] transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 text-[10px]">A (Accountable - מאשר):</label>
                    <input
                      type="text"
                      value={editingTask.raci.a}
                      onChange={(e) => setEditingTask({
                        ...editingTask,
                        raci: { ...editingTask.raci, a: e.target.value }
                      })}
                      className="w-full bg-black border border-white/10 text-white p-1.5 rounded-lg text-right text-xs focus:outline-none focus:border-[#f59e0b] transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 text-[10px]">C (Consulted - מייעץ):</label>
                    <input
                      type="text"
                      value={editingTask.raci.c}
                      onChange={(e) => setEditingTask({
                        ...editingTask,
                        raci: { ...editingTask.raci, c: e.target.value }
                      })}
                      className="w-full bg-black border border-white/10 text-white p-1.5 rounded-lg text-right text-xs focus:outline-none focus:border-[#f59e0b] transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 text-[10px]">I (Informed - מעודכן):</label>
                    <input
                      type="text"
                      value={editingTask.raci.i}
                      onChange={(e) => setEditingTask({
                        ...editingTask,
                        raci: { ...editingTask.raci, i: e.target.value }
                      })}
                      className="w-full bg-black border border-white/10 text-white p-1.5 rounded-lg text-right text-xs focus:outline-none focus:border-[#f59e0b] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs hover:bg-zinc-800 transition-colors"
                >
                  בטל
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEdit(editingTask)}
                  className="px-5 py-2 rounded-lg bg-[#f59e0b] text-black font-semibold text-xs hover:bg-[#d97706] transition-colors"
                >
                  שמור שינויים
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

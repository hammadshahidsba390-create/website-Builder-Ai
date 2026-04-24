import React, { useEffect, useRef, useState } from "react";
import type { Project, Version, Message } from "../types";
import {
  BotIcon,
  EyeIcon,
  Loader2Icon,
  SendIcon,
  UserIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface SidebarProps {
  isMenuOpen: boolean;
  Project: Project;
  SetProject: (project: Project) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
}

const Sidebar = ({
  isMenuOpen,
  Project,
  SetProject,
  isGenerating,
  setIsGenerating,
}: SidebarProps) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const handleRollback = async (versionId: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/user/project/${Project.id}/rollback/${versionId}`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error("Rollback failed");
      // Refresh project data after rollback
      const projectRes = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/user/project/${Project.id}`,
        { credentials: "include" }
      );
      if (projectRes.ok) {
        const data = await projectRes.json();
        if (data.project) SetProject(data.project);
      }
      toast.success("Rolled back successfully");
    } catch (error: any) {
      toast.error(error.message || "Could not rollback version");
    }
  };

  const handleRevesion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsGenerating(true);
    const sentMessage = input.trim();
    setInput("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/user/project/${Project.id}/revision`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: sentMessage }),
        }
      );

      if (res.status === 403) {
        toast.error("Not enough credits to make changes");
        setIsGenerating(false);
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Revision failed");
      }

      // Poll for the updated project data
      const poll = setInterval(async () => {
        try {
          const projectRes = await fetch(
            `${import.meta.env.VITE_BASEURL}/api/user/project/${Project.id}`,
            { credentials: "include" }
          );
          if (projectRes.ok) {
            const data = await projectRes.json();
            if (data.project) {
              SetProject(data.project);
              setIsGenerating(false);
              clearInterval(poll);
            }
          }
        } catch {
          // keep polling
        }
      }, 2000);

      // Timeout after 60 seconds
      setTimeout(() => {
        clearInterval(poll);
        setIsGenerating(false);
      }, 60000);
    } catch (error: any) {
      toast.error(error.message || "Could not make revision");
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [Project.conversation?.length, isGenerating]);

  return (
    <div
      className={`h-full sm:w-80 bg-gray-900 border-r border-gray-800 transition-all duration-300 
      ${isMenuOpen ? 'max-sm:w-0 overflow-hidden' : "w-full"}`}
    >
      <div className="flex flex-col h-full">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
          {[...(Project.conversation || []), ...(Project.versions || [])]
            .sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            )
            .map((message) => {
              const isMessage = "content" in message;

              if (isMessage) {
                const msg = message as Message;
                const isUser = msg.role === "user";

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <BotIcon className="size-5 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow ${
                        isUser
                          ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-tr-none"
                          : "rounded-tl-none bg-gray-800 text-gray-100"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <UserIcon className="size-5 text-gray-200" />
                      </div>
                    )}
                  </div>
                );
              } else {
                const ver = message as Version;

                return (
                  <div
                    key={ver.id}
                    className="w-[85%] mx-auto p-3 rounded-xl bg-gray-800 text-gray-100 shadow flex flex-col gap-2"
                  >
                    <div>
                      Code updated<br />
                      <span className="text-xs text-gray-400">
                        {new Date(ver.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      {Project.current_version_index === ver.id ? (
                        <button className="px-3 py-1 text-xs bg-gray-700 rounded-md">
                          Current Version
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRollback(ver.id)}
                          className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition"
                        >
                          Rollback to this version
                        </button>
                      )}

                      <Link
                        target="_blank"
                        to={`/preview/${Project.id}/${ver.id}`}
                      >
                        <EyeIcon className="size-6 p-1 bg-gray-700 hover:bg-indigo-600 rounded transition" />
                      </Link>
                    </div>
                  </div>
                );
              }
            })}

          {isGenerating && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <BotIcon className="size-5 text-white" />
              </div>
              {/* three dot loader */}
              <div className="flex gap-1 h-full items-end">
                <span
                  className="size-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0s" }}
                />
                <span
                  className="size-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="size-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          )}

          <div ref={messageRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleRevesion} className="m-3 relative">
          <div className="flex items-center gap-2">
            <textarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              rows={4}
              placeholder="Describe your changes..."
              className="flex-1 p-3 rounded-xl resize-none text-sm outline-none bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition"
              disabled={isGenerating}
            />

            <button
              type="submit"
              disabled={isGenerating || !input.trim()}
              className="absolute bottom-2.5 right-2.5 rounded-full
              bg-gradient-to-r from-indigo-600 to-indigo-700
              hover:from-indigo-500 hover:to-indigo-600
              text-white transition-colors disabled:opacity-60 p-1"
            >
              {isGenerating ? (
                <Loader2Icon className="size-6 animate-spin text-white" />
              ) : (
                <SendIcon className="size-6 text-white" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sidebar;

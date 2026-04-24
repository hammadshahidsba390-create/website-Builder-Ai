import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Project } from "../types";
import Sidebar from "../components/Sidebar";
import {
  ArrowBigRightDashIcon,
  EyeIcon,
  EyeOffIcon,
  Fullscreen,
  LaptopIcon,
  Loader2Icon,
  MessageSquareIcon,
  SaveIcon,
  SmartphoneIcon,
  TabletIcon,
  XIcon,
} from "lucide-react";
import ProjectPreview, { type ProjectPreviewRef } from "../components/ProjectPreview";
import { toast } from "sonner";

const Projects = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [device, setdevice] = useState<"phone" | "tablet" | "desktop">("desktop");
  const [isMenueOpen, setIsMenueOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const previewRef = useRef<ProjectPreviewRef>(null);

  const fetchProject = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/user/project/${projectId}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to load project");
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
        // If project has no code yet, it may still be generating
        setIsGenerating(!data.project.current_code);
      }
    } catch (error: any) {
      toast.error(error.message || "Could not load project");
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates while generating
  useEffect(() => {
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASEURL}/api/user/project/${projectId}`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.project?.current_code) {
          setProject(data.project);
          setIsGenerating(false);
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isGenerating, projectId]);

  const saveproject = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      const code = previewRef.current?.getCode() || project.current_code;
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/user/project/${projectId}/save`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );
      if (!res.ok) throw new Error("Failed to save project");
      toast.success("Project saved!");
    } catch (error: any) {
      toast.error(error.message || "Could not save project");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadcode = () => {
    const code = previewRef.current?.getCode() || project?.current_code;
    if (!code) return;
    const element = document.createElement("a");
    const file = new Blob([code], { type: "text/html" });
    element.href = URL.createObjectURL(file);
    element.download = "index.html";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const togglepublish = async () => {
    if (!project) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/user/publish-toggle/${projectId}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to update publish status");
      const data = await res.json();
      toast.success(data.message || "Status updated");
      setProject((prev) =>
        prev ? { ...prev, isPublished: !prev.isPublished } : prev
      );
    } catch (error: any) {
      toast.error(error.message || "Could not toggle publish");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="size-7 animate-spin text-violet-200" />
      </div>
    );
  }

  return project ? (
    <div className="flex flex-col h-screen w-full bg-gray-900 text-white">
      {/* builder navbar */}
      <div className="flex max-sm:flex-col sm:items-center gap-4 px-4 py-2">
        {/* left */}
        <div className="flex items-center gap-2 min-w-[90px] text-nowrap">
          <img
            src="/fevicon.svg"
            alt="logo"
            className="h-6 cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div className="max-w-xs">
            <p className="text-sm font-medium capitalize truncate">
              {project.name}
            </p>
            <p className="text-xs text-gray-400 -mt-0.5">
              Previewing last saved version
            </p>
          </div>

          <div className="sm:hidden flex-1 flex justify-end">
            {isMenueOpen ? (
              <XIcon
                onClick={() => setIsMenueOpen(false)}
                className="size-6 cursor-pointer"
              />
            ) : (
              <MessageSquareIcon
                onClick={() => setIsMenueOpen(true)}
                className="size-6 cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* middle */}
        <div className="hidden sm:flex gap-2 bg-gray-950 p-1.5 rounded-md">
          <SmartphoneIcon
            onClick={() => setdevice("phone")}
            className={`size-6 p-1 rounded cursor-pointer ${device === "phone" ? "bg-gray-700" : ""}`}
          />
          <TabletIcon
            onClick={() => setdevice("tablet")}
            className={`size-6 p-1 rounded cursor-pointer ${device === "tablet" ? "bg-gray-700" : ""}`}
          />
          <LaptopIcon
            onClick={() => setdevice("desktop")}
            className={`size-6 p-1 rounded cursor-pointer ${device === "desktop" ? "bg-gray-700" : ""}`}
          />
        </div>

        {/* right */}
        <div className="flex items-center justify-end gap-3 flex-1 text-xs sm:text-sm">
          <button
            onClick={saveproject}
            disabled={isSaving}
            className="max-sm:hidden bg-gray-800 hover:bg-gray-700 text-white px-3.5 py-1 flex items-center gap-2 rounded border border-gray-700"
          >
            {isSaving ? (
              <Loader2Icon className="animate-spin" size={16} />
            ) : (
              <SaveIcon size={16} />
            )}
            Save
          </button>

          <Link
            target="_blank"
            to={`/preview/${projectId}`}
            className="flex items-center gap-2 px-4 py-1 rounded border border-gray-700 hover:border-gray-500"
          >
            <Fullscreen size={16} />
            Preview
          </Link>

          <button
            onClick={downloadcode}
            className="bg-gradient-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white px-3.5 py-1 flex items-center gap-2 rounded"
          >
            <ArrowBigRightDashIcon size={16} /> Download
          </button>

          <button
            onClick={togglepublish}
            className="bg-gradient-to-br from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white px-3.5 py-1 flex items-center gap-2 rounded"
          >
            {project.isPublished ? (
              <EyeOffIcon size={16} />
            ) : (
              <EyeIcon size={16} />
            )}
            {project.isPublished ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-auto">
        <Sidebar
          isMenuOpen={isMenueOpen}
          Project={project}
          SetProject={(p) => setProject(p)}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />

        <div className="flex-1 p-2 pl-0">
          <ProjectPreview
            ref={previewRef}
            project={project}
            isGenerating={isGenerating}
            device={device}
          />
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-screen">
      <p className="text-2xl font-medium text-gray-200">
        Unable to load project
      </p>
    </div>
  );
};

export default Projects;

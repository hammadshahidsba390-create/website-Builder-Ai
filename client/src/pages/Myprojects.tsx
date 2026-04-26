import { useEffect, useState } from "react";
import type { Project } from "../types";
import { Loader2Icon, PlusIcon, TrashIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { toast } from "sonner";

const Myprojects = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL || "http://localhost:3000"}/api/user/projects`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch projects");

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else {
        throw new Error("Expected JSON response but received something else");
      }
    } catch (error: any) {
      toast.error(error.message || "Could not load projects");
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    // Optimistically remove from UI
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/user/project/${projectId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        // Restore on failure
        fetchProjects();
        toast.error("Failed to delete project");
      } else {
        toast.success("Project deleted");
      }
    } catch {
      fetchProjects();
      toast.error("Failed to delete project");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <>
      <div className="px-4 md:px-16 lg:px-24 xl:px-32 bg-black min-h-screen text-white">
        {loading ? (
          <div className="flex items-center justify-center h-[80vh]">
            <Loader2Icon className="size-7 animate-spin text-indigo-400" />
          </div>
        ) : projects.length > 0 ? (
          <div className="py-12 min-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <h1 className="text-3xl font-semibold">My Projects</h1>

              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-5 py-2 rounded-lg 
                bg-gradient-to-r from-indigo-500 to-purple-600 
                hover:opacity-90 active:scale-95 transition"
              >
                <PlusIcon size={18} />
                Create New
              </button>
            </div>

            {/* Projects Grid */}
            <div className="flex flex-wrap gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="relative group w-80 max-sm:mx-auto cursor-pointer 
                  bg-gray-900 border border-gray-800 rounded-xl overflow-hidden 
                  shadow-md hover:shadow-indigo-700/20 
                  hover:border-indigo-600/50 transition-all duration-300"
                >
                  {/* Preview */}
                  <div className="relative w-full h-44 bg-gray-950 border-b border-gray-800 overflow-hidden">
                    {project.current_code ? (
                      <iframe
                        srcDoc={project.current_code}
                        className="absolute top-0 left-0 w-[1200px] h-[800px] origin-top-left pointer-events-none"
                        sandbox="allow-scripts allow-same-origin"
                        style={{ transform: "scale(0.26)" }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <p>No Preview</p>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h2 className="text-lg font-semibold">
                      {project.name}
                    </h2>

                    <p className="text-gray-400 mt-2 text-sm line-clamp-2">
                      {project.initial_prompt}
                    </p>

                    {/* Bottom Section */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex justify-between items-center mt-6"
                    >
                      <span className="text-sm text-gray-500">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex gap-3 text-sm">
                        <button
                          onClick={() =>
                            navigate(`/preview/${project.id}`)
                          }
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md transition"
                        >
                          Preview
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/projects/${project.id}`)
                          }
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <TrashIcon
                      onClick={() => deleteProject(project.id)}
                      className="absolute top-3 right-3 scale-0 group-hover:scale-100 
                      bg-gray-800 p-1.5 size-7 rounded-lg text-red-500 
                      hover:bg-red-600 hover:text-white cursor-pointer transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <h1 className="text-3xl font-semibold text-gray-400">
              You Have No Projects Yet
            </h1>

            <button
              onClick={() => navigate("/")}
              className="mt-6 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition"
            >
              Create New
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default Myprojects;

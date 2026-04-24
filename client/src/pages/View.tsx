import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2Icon } from "lucide-react";
import ProjectPreview from "../components/ProjectPreview";
import type { Project } from "../types";
import { toast } from "sonner";

const View = () => {
  const { projectId } = useParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCode = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/project/${projectId}`
      );
      if (!res.ok) throw new Error("Project not found or not published");
      const data = await res.json();
      setCode(data.code || '');
    } catch (error: any) {
      toast.error(error.message || "Could not load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCode();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="size-7 animate-spin text-indigo-200" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      {code ? (
        <ProjectPreview
          project={{ current_code: code } as Project}
          isGenerating={false}
          showEditorPanel={false}
        />
      ) : (
        <div className="flex items-center justify-center h-screen text-gray-400">
          <p className="text-xl">Project not available</p>
        </div>
      )}
    </div>
  );
};

export default View;
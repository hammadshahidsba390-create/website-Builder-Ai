import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2Icon } from "lucide-react";
import ProjectPreview from "../components/ProjectPreview";
import type { Project } from "../types";
import { toast } from "sonner";

const Preview = () => {
  const { projectId } = useParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCode = async () => {
    try {
      // Try authenticated endpoint first (owner preview)
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/user/project/${projectId}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.project?.current_code) {
          setCode(data.project.current_code);
          setLoading(false);
          return;
        }
      }
      // Fallback: public view endpoint
      const pubRes = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/project/${projectId}`,
        { credentials: "include" }
      );
      if (!pubRes.ok) throw new Error("Project not found or not published");
      const pubData = await pubRes.json();
      setCode(pubData.code || '');
    } catch (error: any) {
      toast.error(error.message || "Could not load preview");
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
    <div className="h-screen">
      {code && (
        <ProjectPreview
          project={{ current_code: code } as Project}
          isGenerating={false}
          showEditorPanel={false}
        />
      )}
      {!code && (
        <div className="flex items-center justify-center h-screen text-gray-400">
          <p className="text-xl">No preview available</p>
        </div>
      )}
    </div>
  );
};

export default Preview;
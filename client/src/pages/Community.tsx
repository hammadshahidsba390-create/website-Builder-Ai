import { useEffect, useState } from 'react'
import type { Project } from '../types';
import { Loader2Icon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { toast } from 'sonner';

const Community = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL || "http://localhost:3000"}/api/user/published-projects`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to fetch community projects');
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else {
        throw new Error('Expected JSON response but received something else');
      }
    } catch (error: any) {
      toast.error(error.message || 'Could not load community projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <>
      <div className='px-4 md:px-16 lg:px-24 xl:px-32'>
        {loading ? (
          <div className='flex items-center justify-center h-[80vh]'>
            <Loader2Icon className='size-7 animate-spin text-indigo-200' />
          </div>
        ) : projects.length > 0 ? (
          <div className='py-10 min-h-[80vh]'>
            <div className='flex items-center justify-between mb-12'>
              <h1 className='text-2xl font-medium text-white'>
                Published Projects
              </h1>
            </div>

            <div className='flex flex-wrap gap-4'>
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/View/${project.id}`}
                  target='_blank'
                  className='w-72 max-sm:mx-auto cursor-pointer bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden group hover:border-indigo-800/80 transition-all duration-300'
                >
                  {/* Preview */}
                  <div className='relative w-full h-40 bg-gray-900 overflow-hidden border-b border-gray-800'>
                    {project.current_code ? (
                      <iframe
                        srcDoc={project.current_code}
                        className='absolute top-0 left-0 w-[1200px] h-[800px] origin-top-left pointer-events-none'
                        sandbox='allow-scripts allow-same-origin'
                        style={{ transform: 'scale(0.25)' }}
                      />
                    ) : (
                      <div className='flex items-center justify-center h-full text-gray-500'>
                        <p>No Preview</p>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className='p-4 text-white bg-gradient-to-b from-transparent group-hover:from-indigo-950 to-transparent transition-colors'>
                    <div className='flex items-start justify-between'>
                      <h2 className='text-lg font-medium'>
                        {project.name}
                      </h2>
                      <span className='px-2.5 py-0.5 mt-1 ml-2 text-xs bg-gray-800 border border-gray-700 rounded-full'>
                        Website
                      </span>
                    </div>

                    <p className='text-gray-400 mt-1 text-sm line-clamp-2'>
                      {project.initial_prompt}
                    </p>

                    <div className='flex justify-between items-center mt-6'>
                      <span className='text-xs text-gray-500'>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/preview/${project.id}`);
                        }}
                        className='px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-md transition-colors flex items-center gap-2 text-sm'
                      >
                        <span>
                          {project.user?.name?.slice(0, 1)}
                        </span>
                        {project.user?.name}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center h-[80vh]'>
            <h1 className='text-3xl font-semibold text-gray-300'>
              No Published Projects Yet
            </h1>
            <button
              onClick={() => navigate('/')}
              className='text-white px-5 py-2 mt-5 rounded-md bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all'
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

export default Community;

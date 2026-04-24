import { Loader2Icon } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Home = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/user/project`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initial_prompt: input.trim() }),
        }
      );

      if (res.status === 401) {
        toast.error('Please log in to create a project');
        navigate('/auth/sign-in');
        return;
      }
      if (res.status === 403) {
        toast.error('Not enough credits. Please purchase more.');
        navigate('/pricing');
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create project');
      }

      const data = await res.json();
      navigate(`/projects/${data.projectId}`);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-white px-6 overflow-hidden bg-black">

      {/* Gradient Background Blobs */}
      <div className="absolute w-[600px] h-[600px] bg-purple-600/30 blur-[140px] rounded-full top-[-150px] left-[-200px]" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-600/30 blur-[140px] rounded-full bottom-[-150px] right-[-150px]" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl">

        <h1 className="text-5xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
          Build AI Websites
          <br />
          In Seconds.
        </h1>

        <p className="mt-6 text-gray-300 text-lg md:text-xl max-w-2xl">
          Turn your ideas into powerful, modern websites instantly with intelligent automation.
        </p>

        {/* Glass Form */}
        <form
          onSubmit={onSubmitHandler}
          className="mt-14 w-full max-w-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-2xl p-6 transition-all duration-500 hover:border-indigo-500/40"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent resize-none outline-none text-gray-200 placeholder-gray-400 text-base"
            rows={4}
            placeholder="Describe the website you want to build..."
            required
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="mt-5 w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 rounded-lg py-3 font-medium text-lg shadow-lg hover:shadow-purple-500/30 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {!loading ? (
              "Generate Website"
            ) : (
              <>
                Generating
                <Loader2Icon className="animate-spin size-5" />
              </>
            )}
          </button>
        </form>

      </div>
    </section>
  );
};

export default Home;

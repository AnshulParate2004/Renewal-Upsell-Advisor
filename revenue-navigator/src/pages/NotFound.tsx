import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ShieldAlert, ArrowLeft, Ghost } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-purple-50/30 p-8 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-200/20 rounded-full blur-[100px]" />

      <div className="paper-card max-w-lg w-full bg-white p-12 text-center relative overflow-hidden shadow-2xl shadow-purple-900/10 rounded-[2.5rem] border border-gray-100">
        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

        <div className="flex justify-center mb-10">
          <div className="h-24 w-24 bg-primary/5 rounded-3xl flex items-center justify-center animate-bounce border border-primary/10">
            <Ghost size={48} className="text-primary" />
          </div>
        </div>

        <h1 className="text-8xl font-black text-foreground tracking-tighter leading-none mb-6">
          404
        </h1>

        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-8 font-mono">
          PATH_RESOLUTION_FAILURE: {location.pathname.toUpperCase()}
        </p>

        <div className="p-6 bg-red-50 rounded-2xl border border-red-100/50 text-red-500 font-bold uppercase tracking-widest text-[10px] mb-12 flex items-center justify-center gap-3">
          <ShieldAlert size={18} />
          COORDINATES_OUTSIDE_SECURE_ZONE
        </div>

        <Link
          to="/"
          className="btn-punch bg-primary text-white py-5 px-10 inline-flex items-center gap-4 text-[11px] font-black uppercase tracking-widest group shadow-xl shadow-primary/20"
        >
          <ArrowLeft className="group-hover:-translate-x-2 transition-transform" />
          RE_ROUTE_TO_HQ
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

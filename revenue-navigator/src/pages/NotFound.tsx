import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ShieldAlert, ArrowLeft, Ghost } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white bg-grid p-8 relative overflow-hidden">
      <div className="max-w-lg w-full bg-white border border-black rounded-lg p-12 text-center relative hover:shadow-md transition-all">
        <div className="flex justify-center mb-10">
          <div className="h-24 w-24 bg-primary/10 border border-black rounded-lg flex items-center justify-center animate-bounce">
            <Ghost size={48} className="text-primary" />
          </div>
        </div>

        <h1 className="text-8xl font-black text-black tracking-tighter leading-none mb-6">
          404
        </h1>

        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/60 mb-8 font-mono">
          PATH_RESOLUTION_FAILURE: {location.pathname.toUpperCase()}
        </p>

        <div className="p-6 bg-red-50 border border-black rounded-lg text-red-600 font-black uppercase tracking-widest text-[10px] mb-12 flex items-center justify-center gap-3">
          <ShieldAlert size={18} />
          COORDINATES_OUTSIDE_SECURE_ZONE
        </div>

        <Link
          to="/"
          className="px-10 py-5 bg-primary text-white border border-black rounded-lg inline-flex items-center gap-4 text-[11px] font-black uppercase tracking-widest group hover:shadow-md transition-all"
        >
          <ArrowLeft className="group-hover:-translate-x-2 transition-transform" />
          RE_ROUTE_TO_HQ
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

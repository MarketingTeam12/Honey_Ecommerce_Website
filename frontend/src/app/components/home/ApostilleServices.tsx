import { useNavigate } from 'react-router-dom';

export function ApostilleServices() {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(path);
  };

  return (
    <section className="py-20 bg-gradient-to-r from-[#0a1247] to-[#1a2457] text-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-6">
          Simplify Document Legalization with Our Apostille Translation Services
        </h2>
        <button 
          onClick={() => handleNavigate('/all-apostille-products')}
          className="bg-white text-[#0a1247] px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors shadow-lg mt-4 animate-blink"
        >
          Upload Your Document
        </button>
      </div>
    </section>
  );
}

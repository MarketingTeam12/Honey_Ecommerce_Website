import { useNavigate } from 'react-router-dom';

export function SwornTranslation() {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(path);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg p-12 shadow-xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Sworn Translation Services
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Our sworn translations are legally certified and recognized by official institutions worldwide. Perfect for legal documents, academic certificates, and official paperwork.
          </p>
          <button 
            onClick={() => handleNavigate('/all-translation-products')}
            className="bg-purple-600 text-white px-8 py-3 rounded-full font-medium hover:bg-purple-700 transition-colors shadow-lg animate-blink"
          >
            Upload Document
          </button>
        </div>
      </div>
    </section>
  );
}

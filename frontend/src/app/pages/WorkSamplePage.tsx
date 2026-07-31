import { useState, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';
import exampleImage from 'figma:asset/2b5d92b752452ee96adba1a106a3de42ffc5f274.png';

interface WorkSample {
  id: string;
  title: string;
  category: string;
  description: string;
  fileUrl: string;
  fileName: string;
  order: number;
  status: string;
}

export function WorkSamplePage() {
  const [samples, setSamples] = useState<WorkSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        console.log('📋 Fetching work samples...');
        
        const response = await fetch(
          `${API_URL}/work-samples`,
          {
            headers: buildHeaders(),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          
          // Check if it's a backend deployment issue
          const isBackendIssue = errorText.includes('Invalid JWT') || 
                                 errorText.includes('"code":401') ||
                                 response.status === 401;
          
          if (isBackendIssue) {
            console.warn('⚠️ [WorkSample] Backend not available - showing empty state');
            setSamples([]);
            setError(null); // Don't show error for backend issues
            return;
          }
          
          throw new Error('Failed to fetch work samples');
        }

        const data = await response.json();
        console.log('✅ Work samples loaded:', data.samples?.length || 0);
        setSamples(data.samples || []);
      } catch (err) {
        console.error('❌ Error fetching work samples:', err);
        
        // Only set error for non-backend issues
        if (err instanceof TypeError && err.message.includes('fetch')) {
          console.warn('⚠️ [WorkSample] Network error - backend may not be available');
          setSamples([]);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load work samples');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, []);

  // Group samples by category
  const samplesByCategory = samples.reduce((acc, sample) => {
    if (!acc[sample.category]) {
      acc[sample.category] = [];
    }
    acc[sample.category].push(sample);
    return acc;
  }, {} as Record<string, WorkSample[]>);

  const handleDownload = async (sample: WorkSample) => {
    try {
      console.log(`📥 Downloading: ${sample.title}`);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = sample.fileUrl;
      link.download = sample.fileName || 'work-sample.pdf';
      link.target = '_blank'; // Open in new tab if download doesn't work
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Download initiated');
    } catch (err) {
      console.error('❌ Download error:', err);
      alert('Failed to download the sample. Please try again.');
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Sample of Certified Translation</h1>
        <p className="text-gray-700">
          Explore examples of our professional translation work across various language pairs
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading work samples...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Samples by Category */}
      {!loading && !error && (
        <>
          {Object.keys(samplesByCategory).length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Samples Available</h3>
              <p className="text-gray-600 mb-6">
                Work samples will be available soon. Please check back later or contact us for specific examples.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="mailto:salesteam@honeytranslations.com?subject=Request for Work Samples"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
                >
                  Request Samples via Email
                </a>
                <a 
                  href="https://wa.me/917299005577?text=Hi, I would like to request work samples"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-colors"
                >
                  Request via WhatsApp
                </a>
              </div>
            </div>
          ) : (
            Object.entries(samplesByCategory).map(([category, categorySamples]) => (
              <section key={category} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{category}</h2>
                
                <div className="space-y-3">
                  {categorySamples
                    .filter(sample => sample.status === 'active' && sample.fileUrl)
                    .map((sample, index) => (
                      <div 
                        key={sample.id}
                        className="flex items-center justify-between py-4 px-6 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all group"
                      >
                        <div className="flex items-center gap-4 flex-grow">
                          <span className="text-gray-500 font-medium min-w-[2rem]">
                            {index + 1}.
                          </span>
                          <div>
                            <h3 className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors">
                              {sample.title}
                            </h3>
                            {sample.description && (
                              <p className="text-sm text-gray-600 mt-1">{sample.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDownload(sample)}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-all whitespace-nowrap"
                        >
                          <Download className="w-4 h-4" />
                          Download Sample
                        </button>
                      </div>
                    ))}
                </div>
              </section>
            ))
          )}
        </>
      )}

      {/* Reference Image - Hidden but available */}
      <div className="hidden">
        <img src={exampleImage} alt="Reference design" />
      </div>

      {/* Additional Information */}
      {!loading && !error && samples.length > 0 && (
        <section className="mt-12">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confidentiality Guaranteed</h3>
            <p className="text-gray-700">
              All work samples are anonymized to protect client privacy. We maintain strict confidentiality agreements and never share identifiable client information without explicit permission.
            </p>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {!loading && !error && samples.length > 0 && (
        <section className="mt-12">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need More Samples?</h2>
            <p className="text-gray-700 mb-6">
              To view specific work samples relevant to your industry or project type, please contact our team. We'll be happy to share sample translations that match your requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="mailto:salesteam@honeytranslations.com?subject=Request for Work Samples"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
              >
                Request Samples via Email
              </a>
              <a 
                href="https://wa.me/917299005577?text=Hi, I would like to request work samples"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-colors"
              >
                Request via WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default WorkSamplePage;
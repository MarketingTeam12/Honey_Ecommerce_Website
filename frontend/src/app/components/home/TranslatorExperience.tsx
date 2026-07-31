export function TranslatorExperience() {
  // Helper function to extract video ID from YouTube URL or return ID if already extracted
  const extractVideoId = (url: string): string => {
    // If it's already just an ID (no slashes or special chars), return it
    if (!url.includes('/') && !url.includes('?')) {
      return url;
    }
    
    // Extract from youtu.be format: https://youtu.be/VIDEO_ID?si=...
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0];
      return id;
    }
    
    // Extract from youtube.com format: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1].split('&')[0];
      return id;
    }
    
    return url;
  };

  // Add your YouTube video URLs or IDs here
  // You can paste full YouTube links or just the video IDs
  const videos = [
    'https://youtu.be/WN6rFWYseNI?si=GIXs0RHKjCm5fexD',
    'https://youtu.be/qhNdikINxZE?si=7h6orTKP-0tgrFoR',
  ];

  return (
    <section className="py-8 md:py-10 bg-white">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-8">
          Translator Experience & Customer Reviews
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-[1450px] mx-auto">
          {videos.map((video, index) => {
            const videoId = extractVideoId(video);
            return (
              <div key={index} className="aspect-video w-full rounded-xl overflow-hidden shadow-xl ring-1 ring-gray-200 bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={`Translator Experience ${index + 1}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

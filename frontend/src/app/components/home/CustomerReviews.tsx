export function CustomerReviews() {
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
  const videos = [
    'https://youtu.be/-NB-fHnrbls?si=ar1YY_HbgGe8JQ_9', // Your customer review video
    'https://youtu.be/qxCIHtgEjio?si=Xscd0DLQrb-qrjrH', // Your second customer review video
    'https://youtu.be/xhSQYwaWhu8?si=I1ayxU2ZzzEu8eSD', // Replace with your actual video IDs
    'https://youtu.be/ZnKyZwr2X6s?si=m10FWbHFK3kb9Ulw', // Replace with your actual video IDs
  ];

  return (
    <section className="py-8 md:py-10 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-6">
          Customer Reviews
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {videos.map((video, index) => {
            const videoId = extractVideoId(video);
            return (
              <div key={index} className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={`Customer Review ${index + 1}`}
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

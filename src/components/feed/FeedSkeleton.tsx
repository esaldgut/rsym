export function FeedSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Create post skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Post skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Media placeholder */}
          <div className="w-full h-96 bg-gray-200 animate-pulse" />

          {/* Interactions */}
          <div className="p-4 space-y-3">
            <div className="flex space-x-4">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
// ===================================
// FILE: frontend/src/components/LoadingSkeleton.jsx
// Reusable Loading Skeleton Component
// ===================================

export const CardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-6 space-y-4">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="flex gap-2 pt-4">
        <div className="h-10 bg-gray-200 rounded-xl flex-1"></div>
        <div className="h-10 bg-gray-200 rounded-xl flex-1"></div>
      </div>
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-gray-100 animate-pulse rounded-2xl p-6 h-32 space-y-3">
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(count)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="bg-white rounded-2xl p-8 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default {
  CardSkeleton,
  StatCardSkeleton,
  ListSkeleton,
  ProfileSkeleton
};

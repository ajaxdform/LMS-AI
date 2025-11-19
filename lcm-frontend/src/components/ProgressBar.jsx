import { Link } from "react-router-dom";

export default function ProgressBar({ completed, total, courseId }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Course Progress</span>
        <span className="text-sm font-medium text-blue-600">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>
          {completed} of {total} chapters completed
        </span>
        {percentage === 100 && courseId && (
          <Link
            to={`/certificates/${courseId}`}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Get Certificate →
          </Link>
        )}
      </div>
    </div>
  );
}

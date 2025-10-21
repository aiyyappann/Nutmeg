import React, { useState, useEffect } from "react";
import { Clock, User, FileText, Briefcase, MessageSquare, Ticket } from "lucide-react";
import { format, parseISO } from "date-fns";

const ActivityTimeline = ({ userId, refreshFlag, autoRefresh = false, rowsToShow = 5 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const rowHeight = 100; // approximate row height for scroll
  const containerHeight = rowHeight * rowsToShow;

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);

      const endpoint = userId
        ? `http://localhost:3001/api/customers/${userId}/activities`
        : `http://localhost:3001/api/activities`;

      try {
        const res = await fetch(endpoint);
        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(res.statusText || errorData);
        }
        const data = await res.json();
        setActivities(data || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load activities. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    if (autoRefresh && !userId) {
      const interval = setInterval(fetchActivities, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, refreshFlag, autoRefresh]);

  const getIcon = (type) => {
    const iconProps = { size: 16, className: "text-white" };
    switch (type) {
      case "contact": return <User {...iconProps} />;
      case "deal": return <Briefcase {...iconProps} />;
      case "interaction": return <MessageSquare {...iconProps} />;
      case "ticket": return <Ticket {...iconProps} />;
      case "note": return <FileText {...iconProps} />;
      default: return <Briefcase {...iconProps} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    try {
      return format(parseISO(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const renderContent = (act) => {
    const details = act.details || {};
    const userName = <span className="font-semibold text-gray-900">{act.full_name || "System"}</span>;

    const action = (act.action || "").toUpperCase().replace(/_/g, "");

    switch (action) {
      case "NEWCUSTOMER":
        return (
          <p>
            {userName} created a new customer:{" "}
            <span className="font-medium text-blue-600">{details.name}</span>.
          </p>
        );

      case "NEWINTERACTION":
        return (
          <p>
            {userName} logged a new interaction about{" "}
            <span className="font-medium text-blue-600">"{details.subject}"</span>.
          </p>
        );

      case "DEALCREATED":
        return (
          <p>
            {userName} created a new deal:{" "}
            <span className="font-medium text-blue-600">"{details.dealTitle}"</span>{" "}
            for <span className="font-medium">{details.customerName}</span>.
          </p>
        );

      case "TICKETSTATUSCHANGED":
      case "TICKETSTATUSCHANGE":
        const newStatus = details.newStatus || details.new_status;
        const title = details.title || `Ticket #${details.title || details.title}`;

        if (!newStatus) {
          console.warn("Activity log is missing status detail:", act);
          return <p>{userName} updated {title}, but the new status is not available.</p>;
        }

        const statusColor =
          newStatus === "Resolved"
            ? "bg-green-500"
            : newStatus === "In Progress"
            ? "bg-yellow-500"
            : "bg-gray-500";

        return (
          <p>
            {userName} updated {title} to{" "}
            <span
              className={`px-2 py-0.5 text-xs font-semibold text-black ${statusColor} rounded-full`}
            >
              {newStatus}
            </span>.
          </p>
        );
      case 'DEALSTAGECHANGED':
            return (
                <>
                    {userName} moved deal <span className="font-medium">"{details.dealTitle || 'N/A'}"</span> from 
                    <span className="bg-gray-200 text-gray-800 text-xs font-medium mx-2 px-2.5 py-0.5 rounded-full">{details.oldStage}</span> to 
                    <span className="bg-green-200 text-green-800 text-xs font-medium mx-2 px-2.5 py-0.5 rounded-full">{details.newStage}</span>.
                </>
            );
      default:
        return (
          <p>
            {userName} performed an action:{" "}
            <span className="font-medium">{act.action}</span> on a{" "}
            <span className="font-medium">{act.target_type}</span>.
          </p>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[480px]">
        <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 h-[480px] text-red-500 bg-red-50 rounded-lg flex justify-center items-center">
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center p-8 h-[480px] text-gray-500 bg-gray-50 rounded-lg flex justify-center items-center">
        No recent activity found.
      </div>
    );
  }

  return (
    <div
      className="relative overflow-y-auto p-4"
      style={{ height: `${containerHeight}px` }}
    >
      <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200" />

      {activities.map((act, idx) => (
        <div key={act.id} className="flex relative mb-6 last:mb-0">
          {/* Icon */}
          <div className="flex flex-col items-center flex-none w-10">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full">
              {getIcon(act.target_type)}
            </div>
          </div>

          {/* Card */}
          <div className="ml-4 flex-grow bg-white border rounded p-3 shadow-sm">
            {renderContent(act)}
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <Clock size={14} className="text-gray-400" />
              <span>{formatDate(act.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;

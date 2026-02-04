import React from "react";
import "./ReadReceipts.css";

const ReadReceipts = ({ readReceipts, userId }) => {
  if (!readReceipts || readReceipts.length === 0) {
    return (
      <div className="read-receipt" title="Not read">
        ✓
      </div>
    );
  }

  // Check if current user has read the message
  const userHasRead = readReceipts.some((r) => r.userId?._id === userId || r.userId === userId);

  if (userHasRead) {
    return (
      <div className="read-receipt read" title="Read">
        ✓✓
      </div>
    );
  }

  return (
    <div className="read-receipt delivered" title="Delivered">
      ✓
    </div>
  );
};

export default ReadReceipts;

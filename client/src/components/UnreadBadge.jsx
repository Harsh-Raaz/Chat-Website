import React from "react";

const UnreadBadge = ({ count }) => {
  if (!count) return null;

  return (
    <span className="min-w-5 h-5 px-1.5 rounded-full bg-green-500 text-white text-[11px] font-bold flex items-center justify-center leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default UnreadBadge;

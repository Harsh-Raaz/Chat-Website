import React, { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { searchUsersByEmail } from "../services/api";

const UserSearch = ({ onSelectUser }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const searchTerm = query.trim();

    if (!searchTerm) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const users = await searchUsersByEmail(searchTerm);
        setResults(users);
      } catch (err) {
        setError(err.response?.data?.message || "Could not search users");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 bg-white/60 rounded-2xl px-3 py-2 border border-white/70">
        <Search className="text-gray-400 w-3.5 h-3.5 shrink-0" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search email..."
          className="bg-transparent text-xs outline-none flex-1 text-gray-700 placeholder-gray-400"
        />
        {loading && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
        {query && !loading && (
          <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {(results.length > 0 || error || query.trim()) && (
        <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl bg-white/70 border border-white/70">
          {error && <p className="px-3 py-2 text-xs text-red-500">{error}</p>}
          {!error && !loading && query.trim() && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-500">No users found</p>
          )}
          {results.map((user) => (
            <button
              key={user._id || user.id}
              onClick={() => {
                onSelectUser(user);
                setQuery("");
                setResults([]);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white transition"
            >
              <img
                src={user.profilePicture || user.profilePic || "/vite.svg"}
                alt={user.name}
                className="w-9 h-9 rounded-xl object-cover object-top"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch;

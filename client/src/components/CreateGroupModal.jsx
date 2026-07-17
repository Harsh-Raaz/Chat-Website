import React, { useEffect, useState } from "react";
import { Loader2, Search, UserPlus, X } from "lucide-react";
import { searchUsersByEmail } from "../services/api";

const getId = (user) => (user?._id || user?.id || "").toString();

const CreateGroupModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const term = query.trim();
    if (!term) return setResults([]);
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setResults(await searchUsersByEmail(term));
      } catch (err) {
        setError(err.response?.data?.message || "Could not search users.");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const addMember = (member) => {
    setMembers((current) => current.some((item) => getId(item) === getId(member)) ? current : [...current, member]);
    setQuery("");
    setResults([]);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim() || !firstMessage.trim()) return setError("Enter a group name and first message.");
    try {
      setSubmitting(true);
      setError("");
      await onCreate({ name: name.trim(), members: members.map(getId), initialMessage: firstMessage.trim() });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create the group.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div><h3 className="font-bold text-gray-800">Create group</h3><p className="mt-1 text-xs text-gray-500">Choose members and send the first message.</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <label className="mt-5 block text-xs font-medium text-gray-600">Group name<input value={name} onChange={(event) => setName(event.target.value)} maxLength="100" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400" placeholder="Weekend plans" /></label>
        <label className="mt-4 block text-xs font-medium text-gray-600">Add members</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2"><Search className="h-4 w-4 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 text-sm outline-none" placeholder="Search by email" />{loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}</div>
        {results.length > 0 && <div className="mt-1 max-h-32 overflow-y-auto rounded-xl border border-gray-100">{results.map((member) => <button key={getId(member)} type="button" onClick={() => addMember(member)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-purple-50"><img src={member.profilePicture || member.profilePic || "/vite.svg"} alt="" className="h-7 w-7 rounded-lg object-cover" /><span className="truncate text-sm text-gray-700">{member.name}</span><UserPlus className="ml-auto h-4 w-4 text-purple-500" /></button>)}</div>}
        {members.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{members.map((member) => <span key={getId(member)} className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">{member.name}<button type="button" onClick={() => setMembers((current) => current.filter((item) => getId(item) !== getId(member)))}><X className="h-3 w-3" /></button></span>)}</div>}
        <label className="mt-4 block text-xs font-medium text-gray-600">First message<textarea value={firstMessage} onChange={(event) => setFirstMessage(event.target.value)} rows="3" className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400" placeholder="Start the conversation..." /></label>
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
        <button disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Create group</button>
      </form>
    </div>
  );
};

export default CreateGroupModal;

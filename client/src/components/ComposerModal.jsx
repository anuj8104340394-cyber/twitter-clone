import React, { useState, useRef, useEffect } from 'react';
import { X, Image, MapPin, Loader2, Send, AtSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { postsAPI, usersAPI } from '../services/api';

export default function ComposerModal({ isOpen, onClose, onPostCreated }) {
  const { user, isAuthenticated } = useAuth();
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Mention autocomplete state
  const [mentionInfo, setMentionInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const maxLength = 280;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 150);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file must be under 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTextChange = async (e) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setText(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (match) {
      const query = match[1];
      const startIndex = match.index;
      setMentionInfo({ query, startIndex, cursorPos });

      try {
        const res = await usersAPI.search(query);
        if (res.data.success) {
          setSuggestions(res.data.users || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        // silent
      }
    } else {
      setMentionInfo(null);
      setSuggestions([]);
    }
  };

  const selectMention = (username) => {
    if (!mentionInfo) return;
    const before = text.slice(0, mentionInfo.startIndex);
    const after = text.slice(mentionInfo.cursorPos);
    const newText = `${before}@${username} ${after}`;
    setText(newText);
    setMentionInfo(null);
    setSuggestions([]);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = mentionInfo.startIndex + username.length + 2;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please write something to post');
      return;
    }

    if (text.trim().length > maxLength) {
      setError(`Post cannot exceed ${maxLength} characters`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('text', text.trim());
      if (location.trim()) {
        formData.append('location', location.trim());
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await postsAPI.createPost(formData);
      if (res.data.success) {
        setText('');
        setLocation('');
        removeImage();
        onClose();
        if (onPostCreated) {
          onPostCreated(res.data.post);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  const charsLeft = maxLength - text.length;
  const isOverLimit = charsLeft < 0;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col md:hidden animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] -ml-2 text-zinc-300 hover:text-white flex items-center justify-center rounded-full"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim() || isOverLimit}
          className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-4 py-2 rounded-full transition flex items-center space-x-1 min-h-[36px]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Post</span>
              <Send className="w-3.5 h-3.5 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* Body / Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <div className="flex space-x-3 flex-1">
          <img
            src={
              user?.avatar ||
              `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`
            }
            alt={user?.name}
            className="w-10 h-10 rounded-full border border-zinc-800 object-cover bg-zinc-900 shrink-0"
          />

          <div className="flex-1 flex flex-col relative min-h-[160px]">
            <textarea
              ref={textareaRef}
              rows={6}
              placeholder="What's happening? (Type @ to tag someone)"
              value={text}
              onChange={handleTextChange}
              className="w-full bg-transparent text-white placeholder-zinc-500 resize-none focus:outline-none text-base leading-relaxed flex-1"
            />

            {/* Mention Suggestions Popover */}
            {mentionInfo && suggestions.length > 0 && (
              <div className="absolute top-20 left-0 right-0 z-40 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                <div className="px-3 py-1.5 border-b border-zinc-800 bg-zinc-950 text-[11px] text-zinc-400 font-medium flex items-center space-x-1">
                  <AtSign className="w-3 h-3 text-sky-400" />
                  <span>Tap to tag user</span>
                </div>
                <div className="divide-y divide-zinc-800/50">
                  {suggestions.map((u, idx) => (
                    <button
                      type="button"
                      key={u.id || u._id || u.username}
                      onClick={() => selectMention(u.username)}
                      className="w-full text-left px-3 py-2.5 flex items-center space-x-2.5 hover:bg-zinc-800 transition min-h-[44px]"
                    >
                      <img
                        src={
                          u.avatar ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`
                        }
                        alt={u.name}
                        className="w-8 h-8 rounded-full border border-zinc-800 object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white truncate block">
                          {u.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 truncate block">
                          @{u.username}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded Image Preview */}
            {imagePreview && (
              <div className="relative mt-2 mb-3 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 max-h-72">
                <img
                  src={imagePreview}
                  alt="Attachment preview"
                  className="w-full h-auto object-cover max-h-72 rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-black text-white rounded-full transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-xs text-rose-400 mb-2 font-medium">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Toolbar Sticky above keyboard */}
      <div className="border-t border-zinc-800/80 bg-zinc-950/95 px-4 py-2.5 flex items-center justify-between pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center space-x-2">
          {/* Image Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            id="mobile-modal-image-input"
          />
          <label
            htmlFor="mobile-modal-image-input"
            className="p-2.5 text-sky-400 hover:bg-sky-500/10 rounded-full cursor-pointer transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Add photo"
          >
            <Image className="w-5 h-5" />
          </label>

          {/* Location Chip / Expandable input */}
          {showLocationInput ? (
            <div className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-xs text-zinc-200">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <input
                type="text"
                placeholder="Location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                autoFocus
                className="bg-transparent focus:outline-none text-xs w-28 text-zinc-200 placeholder-zinc-500"
              />
              <button
                type="button"
                onClick={() => {
                  setLocation('');
                  setShowLocationInput(false);
                }}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLocationInput(true)}
              className="flex items-center space-x-1 text-zinc-400 hover:text-sky-400 bg-zinc-900/60 border border-zinc-800 px-2.5 py-1.5 rounded-full text-xs min-h-[36px]"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>{location || 'Location'}</span>
            </button>
          )}
        </div>

        {/* Character Counter */}
        <div className="flex items-center space-x-2">
          <span
            className={`text-xs ${
              isOverLimit
                ? 'text-rose-500 font-bold'
                : charsLeft <= 20
                ? 'text-amber-400 font-semibold'
                : 'text-zinc-500'
            }`}
          >
            {charsLeft}
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { Image, MapPin, X, Loader2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';

export default function TweetBox({ onPostCreated, placeholder = "What's the civic issue in your ward? Report here..." }) {
  const { user, isAuthenticated } = useAuth();
  const [text, setText] = useState('');
  const [ward, setWard] = useState(user?.ward || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size exceeds 5MB limit');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please write some details for the complaint/post');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('text', text.trim());
      if (ward.trim()) {
        formData.append('ward', ward.trim());
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await postsAPI.createPost(formData);
      if (res.data.success) {
        setText('');
        removeImage();
        if (onPostCreated) {
          onPostCreated(res.data.post);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit post');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 border-b border-slate-800 bg-slate-950/60">
      <div className="flex space-x-3">
        <img
          src={
            user?.avatar ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`
          }
          alt={user?.name}
          className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 shrink-0"
        />

        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              rows={3}
              placeholder={placeholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 resize-none focus:outline-none text-base leading-relaxed"
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-2 mb-3 rounded-2xl overflow-hidden max-h-72 border border-slate-800 bg-black">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="w-full h-auto object-cover max-h-72 rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-xs text-rose-400 mt-1 mb-2 font-medium">
                {error}
              </p>
            )}

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
              <div className="flex items-center space-x-2">
                {/* Photo Upload Button */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  id="tweet-photo-input"
                />
                <label
                  htmlFor="tweet-photo-input"
                  className="p-2 text-sky-400 hover:bg-sky-500/10 rounded-full cursor-pointer transition flex items-center space-x-1"
                  title="Add Photo / Proof"
                >
                  <Image className="w-5 h-5" />
                </label>

                {/* Ward Tag Input */}
                <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-xs text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Ward / Area (e.g. Ward 12)"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="bg-transparent focus:outline-none text-xs w-28 sm:w-36 placeholder-slate-500 text-slate-200"
                  />
                </div>
              </div>

              {/* Submit Button & Character Counter */}
              <div className="flex items-center space-x-3">
                <span className="text-[11px] text-slate-500">
                  {text.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={loading || !text.trim()}
                  className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-sky-500/20"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Post</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

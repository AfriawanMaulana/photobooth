"use client";

import { useState } from "react";
import { User, Check } from "lucide-react";

type NameInputModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmitName: (name: string) => void;
  initialName?: string;
};

export default function NameInputModal({
  isOpen,
  onClose,
  onSubmitName,
  initialName = "",
}: NameInputModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Nama tidak boleh kosong!");
      return;
    }

    setError("");
    onSubmitName(trimmedName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-100 flex flex-col gap-5 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex flex-col gap-1 text-center items-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-1">
            <User size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Masukkan Nama Anda
          </h2>
          <p className="text-xs text-slate-500">
            Nama ini akan digunakan untuk penamaan file foto Anda.
          </p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="userName"
              className="text-xs font-semibold text-slate-700"
            >
              Nama Lengkap / Panggilan
            </label>
            <input
              id="userName"
              type="text"
              autoFocus
              placeholder="Contoh: Budi Santoso"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                error
                  ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                  : "border-slate-200 focus:border-black focus:ring-2 focus:ring-slate-100"
              }`}
            />
            {error && (
              <span className="text-xs text-red-500 font-medium">{error}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-semibold text-white bg-black hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10"
            >
              <Check size={18} />
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

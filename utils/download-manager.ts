import { create } from 'zustand';

interface DownloadState {
  isDownloading: boolean;
  progress: number;
  message: string;
  setDownloading: (isDownloading: boolean) => void;
  updateProgress: (progress: number) => void;
  setMessage: (message: string) => void;
  reset: () => void;
}

export const useDownloadStore = create<DownloadState>(set => ({
  isDownloading: false,
  progress: 0,
  message: '',
  setDownloading: isDownloading => set({ isDownloading }),
  updateProgress: progress => set({ progress }),
  setMessage: message => set({ message }),
  reset: () => set({ isDownloading: false, progress: 0, message: '' }),
}));

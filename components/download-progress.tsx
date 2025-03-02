import { LoadingDialog } from '@/components/loading';

import { useDownloadStore } from '@/utils/download-manager';

export const DownloadProgress: React.FC = () => {
  const { isDownloading, progress, message } = useDownloadStore();

  const progressText = progress > 0 ? `${message} (${Math.round(progress * 100)}%)` : message;

  return <LoadingDialog open={isDownloading} message={progressText} />;
};

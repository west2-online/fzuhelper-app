import { memo } from 'react';
import EmptyView from './empty-view';
import ErrorView from './error-view';
import LoadingView from './loading-view';
import NoNetworkView from './no-network-view';

export enum STATE {
  CONTENT,
  EMPTY,
  NO_NETWORK,
  ERROR,
  LOADING,
}

interface MultiStateViewProps {
  state: STATE;
  content: React.ReactElement;
  /** 加载失败或网络错误时，点击刷新的处理函数 */
  refresh?: () => void;
}

const MultiStateView = ({ state, content, refresh }: MultiStateViewProps) => {
  switch (state) {
    case STATE.CONTENT:
      return content;
    case STATE.EMPTY:
      return <EmptyView />;
    case STATE.NO_NETWORK:
      return <NoNetworkView refresh={refresh} />;
    case STATE.ERROR:
      return <ErrorView refresh={refresh} />;
    case STATE.LOADING:
      return <LoadingView />;
  }
};

export default memo(MultiStateView);

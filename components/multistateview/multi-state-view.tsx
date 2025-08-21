import { memo } from 'react';
import { ViewStyle } from 'react-native';
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
  className?: string;
  style?: ViewStyle;
}

const MultiStateView = ({ state, content, refresh, className, style }: MultiStateViewProps) => {
  switch (state) {
    case STATE.CONTENT:
      return content;
    case STATE.EMPTY:
      return <EmptyView className={className} style={style} refresh={refresh} />;
    case STATE.NO_NETWORK:
      return <NoNetworkView className={className} style={style} refresh={refresh} />;
    case STATE.ERROR:
      return <ErrorView className={className} style={style} refresh={refresh} />;
    case STATE.LOADING:
      return <LoadingView className={className} style={style} />;
  }
};

export default memo(MultiStateView);

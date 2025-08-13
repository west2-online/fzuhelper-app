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
  content: React.ReactNode;
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

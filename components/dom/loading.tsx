'use dom';

import { cn } from '@/lib/utils';

import styles from './loading.module.css';

const Loading: React.FC = () => (
  <div className={cn(styles.loading, 'text-primary')}>
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
  </div>
);

export default Loading;

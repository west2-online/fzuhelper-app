import { Component, type ReactNode } from 'react';
import { toast } from 'sonner-native';

import ErrorView from '@/components/multistateview/error-view';

interface CourseErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  handleError?: (error: any) => unknown;
}

interface CourseErrorBoundaryState {
  hasError: boolean;
}

export class CourseErrorBoundary extends Component<CourseErrorBoundaryProps, CourseErrorBoundaryState> {
  constructor(props: CourseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): CourseErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.log('CourseErrorBoundary caught an error:', error, errorInfo);

    // 调用 handleError 显示 toast 错误提示
    if (this.props.handleError) {
      const data = this.props.handleError(error);
      if (data) {
        toast.error((data as { message: string }).message || '加载失败，请检查网络连接');
      }
    } else {
      // 如果没有传入 handleError，显示默认错误提示
      toast.error(error.message || '加载失败，请检查网络连接');
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return <ErrorView refresh={this.handleReset} />;
    }

    return this.props.children;
  }
}

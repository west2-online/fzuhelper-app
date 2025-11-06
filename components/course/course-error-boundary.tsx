import { Component, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface CourseErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface CourseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class CourseErrorBoundary extends Component<CourseErrorBoundaryProps, CourseErrorBoundaryState> {
  constructor(props: CourseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): CourseErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('CourseErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-background p-6">
          <Text className="mb-4 text-xl font-semibold text-foreground">加载失败</Text>
          <Text className="mb-6 text-center text-muted-foreground">
            {this.state.error?.message || '无法加载课表数据，请检查网络连接后重试'}
          </Text>
          <Button onPress={this.handleReset}>
            <Text>重试</Text>
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

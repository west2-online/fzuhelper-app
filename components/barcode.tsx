import JsBarcode from 'jsbarcode';
import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import Loading from '@/components/loading';
import { Text } from '@/components/ui/text';

interface BarcodeViewProps {
  width: number;
  height?: number;
  value?: string;
}

export default function BarcodeView({ width, height = 64, value }: BarcodeViewProps) {
  const svgXml = useMemo(() => {
    if (!value) {
      return undefined;
    }

    try {
      const barcode: { encodings: { data: string }[] } = { encodings: [] };
      // 使用纯数据输出，避免依赖浏览器的 DOM 或 Canvas。
      JsBarcode(barcode, value, { format: 'CODE128', displayValue: false });
      const data = barcode.encodings.map(encoding => encoding.data).join('');
      // 左右各保留 10 个模块的静区，供扫码设备识别条形码边界。
      const quietZone = 10;
      const svgWidth = data.length + quietZone * 2;
      const bars = Array.from(data.matchAll(/1+/g), match => {
        const x = match.index + quietZone;
        return `M${x} 0h${match[0].length}v${height}h-${match[0].length}z`;
      }).join('');

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${height}" preserveAspectRatio="none"><rect width="${svgWidth}" height="${height}" fill="#ffffff"/><path d="${bars}" fill="#000000"/></svg>`;
    } catch (error) {
      console.error('生成条形码失败:', error);
      return undefined;
    }
  }, [height, value]);

  if (!svgXml) {
    return (
      <View className="items-center justify-center" style={{ width, height: height + 24 }}>
        {value ? <Text className="text-sm text-text-secondary">条形码生成失败</Text> : <Loading />}
      </View>
    );
  }

  return (
    <View className="bg-white py-3" accessible accessibilityRole="image" accessibilityLabel="借书证条形码">
      <SvgXml xml={svgXml} width={width} height={height} />
    </View>
  );
}

import { Stack } from 'expo-router';
import { useState } from 'react';
import { ImageSourcePropType, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ImageZoom from 'react-native-image-zoom-viewer';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import Ionicons from '@expo/vector-icons/Ionicons';

import ASSET_BUSINESS_LICENSE from '@/assets/qualifications/business-license.png';
import ASSET_SECURITY_CHECK_RESULT from '@/assets/qualifications/security-check-result.png';
import ASSET_ORGANIZATION_PROOF from '@/assets/qualifications/student-organization-proof.png';
import ASSET_WEBSITE_PROOF from '@/assets/qualifications/website-proof.png';

const POLICE_REGISTRATION = '闽ICP备19020557号-3';
const ICP_REGISTRATION = '闽ICP备19020557号-4A';
const UNIFIED_SOCIAL_CREDIT_CODE = '91350121MA2Y470F5C';

export default function SourceCodePage() {
  const [showFullScreenMap, setShowFullScreenMap] = useState(false); // 控制是否展示全屏地图
  const [currentLicense, setCurrentLicense] = useState<ImageSourcePropType>(ASSET_BUSINESS_LICENSE); // 当前展示的资质证书
  const insets = useSafeAreaInsets();

  // ImageZoom 不支持 className，需要使用 style
  const styles = StyleSheet.create({
    imageZoom: {
      width: '100%',
      height: '100%',
    },
  });

  const showLicense = (asset: ImageSourcePropType) => {
    setCurrentLicense(asset);
    setShowFullScreenMap(true);
  };

  return (
    <>
      <Stack.Screen options={{ title: '合规资质证照信息' }} />

      <PageContainer>
        <ScrollView className="flex-1 rounded-tr-4xl bg-card px-8" contentContainerClassName="pt-8">
          <SafeAreaView edges={['bottom']}>
            <LabelEntry leftText="ICP 备案号" rightText={ICP_REGISTRATION} noIcon />
            <LabelEntry leftText="公安联网备案号" rightText={POLICE_REGISTRATION} noIcon />
            <LabelEntry leftText="统一社会信用代码" rightText={UNIFIED_SOCIAL_CREDIT_CODE} noIcon />
            <LabelEntry leftText="营业执照" rightText="点击查看" onPress={() => showLicense(ASSET_BUSINESS_LICENSE)} />
            <LabelEntry
              leftText="学生组织证明"
              rightText="点击查看"
              onPress={() => showLicense(ASSET_ORGANIZATION_PROOF)}
            />
            <LabelEntry leftText="域名注册信息" rightText="点击查看" onPress={() => showLicense(ASSET_WEBSITE_PROOF)} />
            <LabelEntry
              leftText="安全检查报告"
              description="由福州大学网络安全与信息化办公室提供网络安全等级保护合规检测服务"
              rightText="点击查看"
              onPress={() => showLicense(ASSET_SECURITY_CHECK_RESULT)}
            />
            <View className="space-y-4">
              <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
              <Text className="my-2 text-base text-text-secondary">
                如需其他相关信息，请邮件咨询 admin@west2.online
              </Text>
            </View>
          </SafeAreaView>
        </ScrollView>
      </PageContainer>

      {/* 大图 */}
      <Modal
        visible={showFullScreenMap}
        transparent={true}
        animationType="fade" // 添加过渡动画
        onRequestClose={() => setShowFullScreenMap(false)} // 支持Android返回键
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View className="flex-1 items-center justify-center bg-black/90">
          {/* 关闭按钮 */}
          <TouchableOpacity
            onPress={() => setShowFullScreenMap(false)}
            className={`absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20`}
            activeOpacity={0.7}
            style={{ top: insets.top + 14 }}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <ImageZoom
            enableImageZoom={true}
            enableSwipeDown
            swipeDownThreshold={50}
            onSwipeDown={() => setShowFullScreenMap(false)}
            saveToLocalByLongPress={false} // 防止长按保存菜单
            style={styles.imageZoom}
            renderIndicator={() => <></>} // 修改为返回空的 React Fragment
            imageUrls={[
              {
                url: '',
                props: {
                  source: currentLicense,
                  styles: {
                    // transform: [{ rotate: '90deg' }], // 旋转图片 90 度 但不知道为什么不生效
                    width: '100%', // 确保宽度填满
                    height: '100%', // 确保高度填满
                    resizeMode: 'contain', // 确保图片按比例缩放
                  },
                },
              },
            ]}
          />

          {/* 缩放提示 */}
          <View className="absolute bottom-6 left-0 right-0 items-center" style={{ bottom: insets.bottom + 16 }}>
            <Text className="text-xs text-text-secondary">双指缩放查看详情</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

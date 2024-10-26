import { Pressable, ScrollView, Text, View } from 'react-native';

const classes = [
  ['08:20', '09:05'],
  ['09:15', '10:00'],
  ['10:20', '11:05'],
  ['11:15', '12:00'],
  ['14:00', '14:45'],
  ['14:55', '15:40'],
  ['15:50', '16:35'],
  ['16:45', '17:30'],
  ['19:00', '19:45'],
  ['19:55', '20:40'],
  ['20:50', '21:35'],
];

function Header() {
  return (
    <View className="flex flex-none flex-row items-center bg-white shadow ring-1 ring-black ring-opacity-5">
      <View
        className="flex-shrink-0 flex-grow-0"
        // ensure the width of the element
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          width: 32,
        }}
      >
        <View className="flex flex-shrink-0 flex-col items-center justify-center px-2 py-3">
          <Text>10</Text>
          <Text>月</Text>
        </View>
      </View>
      <View className="flex flex-shrink flex-grow flex-row text-sm">
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周一</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-center align-middle font-semibold text-white">
            10
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周二</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            11
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周三</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            12
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周四</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            13
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周五</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            14
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周六</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            15
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周日</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            16
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function HomePage() {
  return (
    <ScrollView
      className="flex h-full flex-auto flex-col overflow-auto bg-white"
      stickyHeaderIndices={[0]}
      overScrollMode="never"
      bounces={false}
    >
      <Header />
      <View className="flex flex-none flex-grow flex-row py-1">
        <View
          className="flex flex-shrink-0 flex-grow-0 flex-col"
          // ensure the width of the element
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            width: 32,
          }}
        >
          {classes.map((time, index) => (
            <View
              key={index}
              className="flex flex-grow flex-col items-center py-1"
              // ensure the width of the element
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                width: 32,
              }}
            >
              <Text className="text-[12px] font-bold text-gray-500">
                {index + 1}
              </Text>
              <Text className="text-[8px] text-gray-500">{time[0]}</Text>
              <Text className="text-[8px] text-gray-500">{time[1]}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

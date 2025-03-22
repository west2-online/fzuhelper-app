import type { SeatData } from '@/types/learning-center';

export enum SpaceStatus {
  Available = 0,
  Occupied = 1,
}

export const SEAT_ITEM_HEIGHT = 64;

// 座位分区表
export const SeatAreaCharts: [number, number, string, string][] = [
  [1, 204, 'J区', '多人座'],
  [205, 268, 'A区', '单人座'],
  [269, 368, 'B区', '单人座'],
  [369, 416, 'D区', '单人座'],
  [417, 476, 'C区', '单人座'],
  [477, 616, 'I区', '多人座'],
  [617, 640, 'F区', '沙发座'],
  [641, 736, 'H区', '多人座、沙发座'],
  [737, 758, 'G区', '多人座'],
  [759, 804, 'E区', '多人座'],
  [805, 837, 'K区', '多人座'],
  [838, 870, 'L区', '多人座'],
  [871, 919, 'M区', '多人座'],
];

// 转换座位显示名称，这里的 spacename 一律是数字
export const convertSpaceName = (spaceName: string): string => {
  const spaceNumber = Number(spaceName);

  switch (true) {
    case spaceNumber >= 205 && spaceNumber <= 476:
      return `${spaceName}\n单人座`;
    case spaceNumber >= 617 && spaceNumber <= 620:
      return `${spaceName}\n沙发 #1`;
    case spaceNumber >= 621 && spaceNumber <= 624:
      return `${spaceName}\n沙发 #2`;
    case spaceNumber >= 625 && spaceNumber <= 628:
      return `${spaceName}\n沙发 #3`;
    case spaceNumber >= 629 && spaceNumber <= 632:
      return `${spaceName}\n沙发 #4`;
    case spaceNumber >= 633 && spaceNumber <= 636:
      return `${spaceName}\n沙发 #5`;
    case spaceNumber >= 637 && spaceNumber <= 640:
      return `${spaceName}\n沙发 #6`;
    case spaceNumber >= 641 && spaceNumber <= 646:
      return `${spaceName}\n沙发 #7`;
    case spaceNumber >= 647 && spaceNumber <= 652:
      return `${spaceName}\n沙发 #8`;
    case spaceNumber >= 653 && spaceNumber <= 658:
      return `${spaceName}\n沙发 #9`;
    case spaceNumber >= 659 && spaceNumber <= 664:
      return `${spaceName}\n沙发 #10`;
    default:
      return spaceName;
  }
};

// 获取座位所在区域
export const getSpaceArea = (spaceName: string) => {
  const spaceNumber = Number(spaceName.split('-')[0]);
  const area = SeatAreaCharts.find(([start, end]) => spaceNumber >= start && spaceNumber <= end);
  return area ? area[2] : '其他';
};

// 根据区域分组座位
export const groupSeatsByArea = (seats: SeatData[]) =>
  seats.reduce(
    (acc, item) => {
      const area = getSpaceArea(item.spaceName);
      acc[area] = acc[area] || [];
      acc[area].push(item);
      return acc;
    },
    {} as Record<string, SeatData[]>,
  );

export const getSeatsSummary = (areaSeats: SeatData[]) => {
  if (!areaSeats || areaSeats.length === 0) return { total: 0, available: 0, occupied: 0 };

  const total = areaSeats.length;
  const available = areaSeats.filter(seat => seat.spaceStatus === SpaceStatus.Available).length;
  const occupied = total - available;

  return { total, available, occupied };
};

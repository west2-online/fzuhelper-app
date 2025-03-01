// 发送请求的座位号并不是我们熟知的座位号，需要通过座位号映射表进行转换
// TODO: csv 中可能存在现实不存在的座位，需要验证

import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export class SeatMappingUtil {
  private static _seatMap: { [key: string]: string } = {};
  private static _isInitialized: boolean = false;

  static async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      const csvFile = require('../../../assets/data/toolbox/learning-center/seatIdReferenceTable.csv');
      const fileUri = Asset.fromModule(csvFile).uri;
      const csvData = await FileSystem.readAsStringAsync(fileUri);

      const lines = csvData.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(',');
          if (parts.length >= 3) {
            this._seatMap[parts[2]] = parts[0];
          }
        }
      }
      this._isInitialized = true;
    } catch (e) {
      console.error('Failed to load seat data:', e);
    }
  }

  static convertSeatNameToId(seatName: string): string | undefined {
    const normalizedSeatName = Number.isNaN(Number(seatName)) ? seatName : Number(seatName).toString();
    return this._seatMap[normalizedSeatName];
  }

  static get seatMap(): Readonly<{ [key: string]: string }> {
    return Object.freeze({ ...this._seatMap });
  }
}

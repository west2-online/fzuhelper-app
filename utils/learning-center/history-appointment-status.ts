import dayjs from 'dayjs';

export class Appointment {
  constructor(
    public readonly id: string,
    public readonly floor: string,
    public readonly spaceName: string,
    public readonly date: string,
    public readonly beginTime: string,
    public readonly endTime: string,
    public readonly auditStatus: number,
    public readonly sign: boolean,
  ) {}

  static fromJson(json: Record<string, any>): Appointment {
    return new Appointment(
      json.id?.toString() ?? '',
      json.floor?.toString() ?? '',
      json.spaceName ?? '未知',
      json.date ?? '',
      json.beginTime ?? '',
      json.endTime ?? '',
      json.auditStatus ?? 0,
      json.sign ?? false,
    );
  }

  get canSignIn(): boolean {
    if (this.auditStatus !== 2 || this.sign) return false;

    const now = dayjs();

    try {
      const appointmentDate = dayjs(`${this.date} ${this.beginTime}`);
      const appointmentEndDate = dayjs(`${this.date} ${this.endTime}`);
      const checkInTime = appointmentDate.subtract(15, 'minute');

      return now.isAfter(checkInTime) && now.isBefore(appointmentEndDate);
    } catch {
      return false;
    }
  }

  get isUpcoming(): boolean {
    if (this.auditStatus !== 2) return false;

    const now = dayjs();

    try {
      const appointmentDate = dayjs(`${this.date} ${this.beginTime}`);
      const checkInTime = appointmentDate.subtract(15, 'minute');

      return now.isBefore(checkInTime);
    } catch {
      return false;
    }
  }

  get isExpired(): boolean {
    if (this.auditStatus !== 2 || this.sign) return false;

    const now = dayjs();

    try {
      const appointmentEndDate = dayjs(`${this.date} ${this.endTime}`);

      return now.isAfter(appointmentEndDate);
    } catch {
      return false;
    }
  }

  // 状态：
  // auditStatus: 2-待签到/已签到，3-已取消，4-已完成
  // sign: True-已签到，False-未签到
  getStatusText(): string {
    if (this.auditStatus === 3) {
      return '已取消';
    } else if (this.auditStatus === 4) {
      return '已完成';
    } else if (this.auditStatus === 2) {
      if (!this.sign) {
        if (this.isUpcoming) {
          return '未开始';
        } else if (this.isExpired) {
          return '未签到';
        } else {
          return '待签到';
        }
      } else {
        return '已签到';
      }
    } else {
      return '未知状态';
    }
  }
}

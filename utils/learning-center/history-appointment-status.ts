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

    const now = new Date();
    const dateParts = this.date.split('-');
    const beginTimeParts = this.beginTime.split(':');
    const endTimeParts = this.endTime.split(':');

    if (dateParts.length !== 3 || beginTimeParts.length !== 2 || endTimeParts.length !== 2) {
      return false;
    }

    try {
      const appointmentDate = new Date(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[2], 10),
        parseInt(beginTimeParts[0], 10),
        parseInt(beginTimeParts[1], 10),
      );

      const appointmentEndDate = new Date(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[2], 10),
        parseInt(endTimeParts[0], 10),
        parseInt(endTimeParts[1], 10),
      );

      const checkInTime = new Date(appointmentDate.getTime() - 15 * 60000);

      return now > checkInTime && now < appointmentEndDate;
    } catch {
      return false;
    }
  }

  get isUpcoming(): boolean {
    if (this.auditStatus !== 2) return false;

    const now = new Date();
    const dateParts = this.date.split('-');
    const beginTimeParts = this.beginTime.split(':');

    if (dateParts.length !== 3 || beginTimeParts.length !== 2) {
      return false;
    }

    try {
      const appointmentDate = new Date(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[2], 10),
        parseInt(beginTimeParts[0], 10),
        parseInt(beginTimeParts[1], 10),
      );

      const checkInTime = new Date(appointmentDate.getTime() - 15 * 60000);

      return now < checkInTime;
    } catch {
      return false;
    }
  }

  get isExpired(): boolean {
    if (this.auditStatus !== 2 || this.sign) return false;

    const now = new Date();
    const dateParts = this.date.split('-');
    const endTimeParts = this.endTime.split(':');

    if (dateParts.length !== 3 || endTimeParts.length !== 2) {
      return false;
    }

    try {
      const appointmentEndDate = new Date(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[2], 10),
        parseInt(endTimeParts[0], 10),
        parseInt(endTimeParts[1], 10),
      );

      return now > appointmentEndDate;
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
